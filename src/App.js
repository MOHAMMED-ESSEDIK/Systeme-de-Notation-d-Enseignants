import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = "0xB0Ba2B3aBE935CEf9DeF79278e1dcbfaE92D55a7";

const ABI = [
"function admin() view returns(address)",
"function addTeacher(string memory _name)",
"function rateTeacher(uint teacherId,uint rating)",
"function teacherCount() view returns(uint)",
"function teachers(uint) view returns(string memory,uint,uint)",
"function getAverage(uint teacherId) view returns(uint)",
"function hasVoted(address,uint) view returns(bool)"
];

function App(){

const [account,setAccount] = useState(null);
const [contract,setContract] = useState(null);
const [teachers,setTeachers] = useState([]);
const [teacherName,setTeacherName] = useState("");
const [isAdmin,setIsAdmin] = useState(false);
const [loading,setLoading] = useState(false);

useEffect(()=>{
autoConnect();
},[]);

useEffect(()=>{
if(contract && account){
loadTeachers();
}
},[contract,account]);

/* SELECT METAMASK PROVIDER */

function getProvider(){

if(!window.ethereum) return null;

if(window.ethereum.providers){
return window.ethereum.providers.find(p => p.isMetaMask);
}

return window.ethereum;

}

/* AUTO CONNECT */

async function autoConnect(){

try{

const provider = getProvider();

if(!provider) return;

const ethersProvider = new ethers.BrowserProvider(provider);

const accounts = await ethersProvider.listAccounts();

if(accounts.length){
connectWallet();
}

}catch(err){
console.log("Auto connect error",err);
}

}

/* CONNECT WALLET */

async function connectWallet(){

try{

const provider = getProvider();

if(!provider){
alert("Install MetaMask");
return;
}

const ethersProvider = new ethers.BrowserProvider(provider);

await provider.request({
method:"eth_requestAccounts"
});

const signer = await ethersProvider.getSigner();

const address = await signer.getAddress();

const contractInstance = new ethers.Contract(
CONTRACT_ADDRESS,
ABI,
signer
);

const adminAddress = await contractInstance.admin();

setIsAdmin(address.toLowerCase() === adminAddress.toLowerCase());

setAccount(address);
setContract(contractInstance);

}catch(error){

console.log("Wallet error",error);

}

}

/* LOAD TEACHERS */

async function loadTeachers(){

setLoading(true);

try{

const count = Number(await contract.teacherCount());

let list = [];

for(let i=0;i<count;i++){

const teacher = await contract.teachers(i);

const avg = Number(await contract.getAverage(i));

const voted = await contract.hasVoted(account,i);

list.push({
id:i,
name:teacher[0],
votes:Number(teacher[2]),
average:avg,
voted:voted
});

}

setTeachers(list);

}catch(error){

console.log("Load teachers error",error);

}

setLoading(false);

}

/* ADD TEACHER */

async function addTeacher(){

if(!teacherName) return;

try{

const tx = await contract.addTeacher(teacherName);

await tx.wait();

setTeacherName("");

loadTeachers();

}catch(error){

alert("Only admin can add teachers");

}

}

/* VOTE */

async function vote(id,score){

try{

const tx = await contract.rateTeacher(id,score);

await tx.wait();

loadTeachers();

}catch(error){

alert("Vote failed or already voted");

}

}

/* STAR RATING */

function StarRating({teacherId,voted}){

if(voted){
return <p className="voted">You already voted</p>;
}

return(

<div className="stars">

{[1,2,3,4,5].map(s=>(

<span
key={s}
className="star"
onClick={()=>vote(teacherId,s)}
>
⭐
</span>

))}

</div>

);

}

/* PROGRESS BAR */

function ProgressBar({value}){

const percent = (value/5)*100;

return(

<div className="progress-container">

<div
className="progress-bar"
style={{width:percent+"%"}}
></div>

</div>

);

}

/* UI */

return(

<div className="app">

<h1>Teacher Rating DApp</h1>

{!account ?

<button className="connect" onClick={connectWallet}>
Connect Wallet
</button>

:

<p className="account">
{account.slice(0,6)}...{account.slice(-4)}
</p>

}

{isAdmin && (

<div className="add">

<input
value={teacherName}
onChange={(e)=>setTeacherName(e.target.value)}
placeholder="Teacher name"
/>

<button onClick={addTeacher}>
Add Teacher
</button>

</div>

)}

{loading && <p>Loading teachers...</p>}

<div className="teachers">

{teachers.map(t=>(

<div key={t.id} className="card">

<h2>{t.name}</h2>

<p>Average Rating : {t.average} / 5</p>

<ProgressBar value={t.average}/>

<p>Votes : {t.votes}</p>

{!isAdmin && (
<StarRating teacherId={t.id} voted={t.voted}/>
)}

{isAdmin && <p>Admin cannot vote</p>}

</div>

))}

</div>

</div>

);

}

export default App;