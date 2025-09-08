<?php
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="../mjs/ajx.js"></script>
    <style>
        .dv {
            display: block;
            border: 1px solid black;
            margin: 5px;
            padding: 10px;
        }
    </style>
    <script>
        async function load()
        {
           let data=await api('getall_av');
           let s='';
           for(let i=0;i<data.length;i++)
           {
               s+=`<div class="dv">${i+1}:  ${data[i].משפחה} ${data[i].פרטי} ${data[i].אברך_id}</div>`;
           }
           document.getElementById('cont').innerHTML=s;
        }
    </script>
</head>
<body dir=rtl onload=load()>
   <div id="cont"></div> 
</body>
</html>