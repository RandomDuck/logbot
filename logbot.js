// Imports and constants
const jsondata = require('./data.json');
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

//html default template
const htmlbase=`<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link rel="stylesheet" href="logs.css">
        <title>Log</title>
        <script>
            function hide(type){
            reset();
            x = document.getElementsByClassName("message")
            for (i = 0;i < x.length;i++) {
                x[i].style.display="none"
            }
            x = document.getElementsByClassName(type)
            for (i = 0;i < x.length;i++) {
                x[i].style.display="inline-block"
            }
            }
            function reset(){
                x = document.getElementsByClassName("message")
                for (i = 0;i < x.length;i++) {
                    x[i].style.display="inline-block"
                }
            }
        </script>
    </head>
    <body>
        <button onclick="reset()">Reset</button>
        <div class="wrapper">
        </div>
    </body>
</html>
`
// return html string for attachemt based on type
function handleAttachments(message){
  var atmnt=message.attachments.array()[0]
  var imgLineEnds=["jpg","png","svg","gif","jpeg"]
  var vidLineEnds=["mp4","webm","ogg","flac","mov"]
  var img=false
  var vid=false
  var link=''
  
  imgLineEnds.forEach((i)=>{
    if (atmnt.filename.slice(-i.length).toLowerCase()===i.toLowerCase()) {
      img=true;
    }
  });
  
  vidLineEnds.forEach((i)=>{
    if (atmnt.filename.slice(-i.length).toLowerCase()===i.toLowerCase()) {
      vid=true;
    }
  });

  if (img) {
    link=(`<a href="${atmnt.url}"><img src="${atmnt.url}" class="img"></a>`)
  } else if (vid) {
    link=(`<video controls class="vid" src="${atmnt.url}"></video>`)
  } else {
    link=(`<a class="attachment" href="${atmnt.url}" download><img src="./file.png"><span class="attachmentText">${atmnt.filename}</span></a>`)
  }
  return link
}

// return parsed embeds inside html template
function handleEmbeds(message) {
    var thisFields=""
    var index=1
    var embed=""
    message.embeds[0].fields.forEach((i)=>{

      thisFields+=`
      <details class="subDet">
          <summary>
              Field ${index}: ${i.name}
          </summary>
          ${i.value}
      </details>
      `;
      index+=1
    });
    embed+=`
    <details style="background-color: ${message.embeds[0].hexColor};" class="detailWrap">`
    if(message.embeds[0].title!=null){
      embed+=`
        <summary>
            Title: ${message.embeds[0].title}
        </summary>
      `;
    }
    if(message.embeds[0].description!=null){
      embed+=`
        <details class="subDet">
            <summary>
                Description
            </summary>
            ${message.embeds[0].description}<br>
        </details> 
      `;
    }
    if(message.embeds[0].footer!=null){
      if(message.embeds[0].footer.text!=null){
        embed+=`
        <details class="subDet">
            <summary>
                footer
            </summary>
            ${message.embeds[0].footer.text}<br>
        </details>
        `;
      }
    }
    if(thisFields!=""){
      embed+=`
        <details style="padding: 0.5em;" class="subDet">
            <summary>
                Fields:
            </summary>
            ${thisFields}
        </details>  
      `;
    }
    if(message.embeds[0].image!=null){
      if(message.embeds[0].image.url!=null){
        embed+=`
        <details class="subDet">
            <summary>
                Image url: <a href="${message.embeds[0].image.url}">${message.embeds[0].image.url}</a><br>
            </summary>
            <img src="${message.embeds[0].image.url}">
        </details>
        `;
      }
    }
    if(message.embeds[0].color!=null){
      embed+=`
      Color hex: ${message.embeds[0].hexColor}<br>
      `;
    }
    if(message.embeds[0].author!=null){
      if(message.embeds[0].author.tag!=null){
        embed+=`
        Author: ${message.embeds[0].author.tag}<br>
        `;
      }
    }
    if(message.embeds[0].url!=null){
      embed+=`
      Url: <a href="${message.embeds[0].url}">${message.embeds[0].url}</a><br>
      `;
    }
    embed+=`
    </details>
    `;
    return embed;
}

// Primary function read and write files and handle message data.
function logThatShit(message,date,time){
  var writedata=""
  var insertpoint=0;
  var filepath=`./logs/${message.guild.name}.html`;
  var data=" "

  if (!fs.existsSync(filepath)){
    fs.writeFileSync(filepath,htmlbase);
    logdata=fs.readFileSync("./logs/Log.html",'utf8');
    inputdata=(`\n<a href="./${message.guild.name}.html" class="loglink" ><img src="./file.png"><span class="attachmentText">${message.guild.name}</span></a>`);
    insertpoint=logdata.indexOf('<div class="wrapper">')+'<div class="wrapper">'.length+1;
    writedata=logdata.slice(0,insertpoint)+inputdata+logdata.slice(insertpoint);
    fs.writeFileSync("./logs/Log.html",writedata)
    data=htmlbase;
  }else{
    data=fs.readFileSync(filepath,'utf8');
    if (data.startsWith("<!DOCTYPE html>")==false){
      data=htmlbase;
    }
  }
  
  var msgattachmentstr="";
  var msgembed="";
  
  if (message.attachments.array().length>0){
    var msgattachmentstr=handleAttachments(message);
  }

  if (message.embeds.length>0){
    var msgembed=handleEmbeds(message);
  }

  insertpoint=data.indexOf('<div class="wrapper">')+'<div class="wrapper">'.length+1;
  var inputdata=`
    <div class="message ${message.channel.name}">
        ${msgattachmentstr}
        <a onclick="hide('${message.channel.name}')">
            <span class="guild">
              ${message.guild.name} 
            </span>
            <span class="channel">
              [${message.channel.name}]:
            </span>
        </a>
        <span class="date">
          ${date} 
        </span>
        <span class="time">
          [${time}]: 
        </span>
        <span class="author">
          ${message.author.tag}  
        </span>
        <span class="authorname">
          (${message.member.displayName}): 
        </span>
        <span class="content">
          ${message.cleanContent}
        </span>
        ${msgembed}
    </div>
  `;
  writedata=data.slice(0,insertpoint)+inputdata+data.slice(insertpoint);
  fs.writeFileSync(filepath,writedata)
}

// Activates on start
client.on('ready', () => {
  var datetime=client.readyAt
  var date=`${datetime.getFullYear()}-${datetime.getMonth()+1}/${datetime.getDate()}`
  var time=`${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`
  console.log(`
  Connected: logged in as ${client.user.tag}
  Running bot started: ${date} [${time}]
  Running LogBot version: ${jsondata.botversion}
  `);
});

// Activates on message
client.on('message', message => {
  var datetime=message.createdAt;
  var date=`${datetime.getFullYear()}-${datetime.getMonth()+1}/${datetime.getDate()}`
  var time=`${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`
  logThatShit(message,date,time)
});

// Login using token in data.json
client.login(jsondata.token);
