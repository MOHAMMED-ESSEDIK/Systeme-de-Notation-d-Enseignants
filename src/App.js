import { useState,useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = "0x137BCFD0700FfCa3F26AcdCab3bA17a6bA55c647";

const ABI = [
"function addTeacher(string memory _name)",
"function rateTeacher(uint teacherId,uint rating)",
"function teacherCount() view returns(uint)",
"function teachers(uint) view returns(string memory,uint,uint)",
"function getAverage(uint teacherId) view returns(uint)",
"function hasVoted(address,uint) view returns(bool)"
];

function App(){

const [account,setAccount] = useState("");
const [contract,setContract] = useState(null);
const [teachers,setTeachers] = useState([]);
const [teacherName,setTeacherName] = useState("");

useEffect(()=>{

if(contract){

loadTeachers();

}

},[contract]);

/* CONNECT WALLET */

async function connectWallet(){

try{

if(!window.ethereum){

alert("Install MetaMask");
return;

}

let provider;

if(window.ethereum.providers){

provider = window.ethereum.providers.find(p=>p.isMetaMask);

}else{

provider = window.ethereum;

}

const ethersProvider = new ethers.BrowserProvider(provider);

await provider.request({
method:"eth_requestAccounts"
});

const signer = await ethersProvider.getSigner();

const address = await signer.getAddress();

const contract = new ethers.Contract(
CONTRACT_ADDRESS,
ABI,
signer
);

setAccount(address);
setContract(contract);

}catch(error){

console.log(error);
alert("Wallet connection failed");

}

}

/* LOAD TEACHERS */

async function loadTeachers(){

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

}

/* ADD TEACHER */

async function addTeacher(){

try{

if(!teacherName) return;

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

alert("You already voted for this teacher");

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

return(

<div className="app">

<h1>Teacher Rating DApp</h1>

{!account ?

<button
className="connect"
onClick={connectWallet}
>

Connect Wallet

</button>

:

<p className="account">

{account.slice(0,6)}...
{account.slice(-4)}

</p>

}

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

<div className="teachers">

{teachers.map(t=>(

<div key={t.id} className="card">

<h2>{t.name}</h2>

<p>Average : {t.average}</p>

<ProgressBar value={t.average}/>

<p>Votes : {t.votes}</p>

<StarRating teacherId={t.id} voted={t.voted}/>

</div>

))}

</div>

</div>

);

}

export default App;