import discord
import logging
import datetime
import json
import os
import time as sleeper

htmlbase='''<!DOCTYPE html>
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
'''

def handleAttachments(message):
    atmnt=message.attachments[0]
    imgLineEnds=["jpg","png","svg","gif","jpeg"]
    vidLineEnds=["mp4","webm","ogg","flac","mov"]
    img=False
    vid=False
    link=''
    
    for i in imgLineEnds:
        if atmnt.filename[-len(i):].lower()==i.lower():
            img=True
    
    for i in vidLineEnds:
        if atmnt.filename[-len(i):].lower()==i.lower():
            vid=True

    if img:
        link=(f'<a href="{atmnt.url}"><img src="{atmnt.url}" class="img"></a>')
    elif vid:
        link=(f'<video controls class="vid" src="{atmnt.url}"></video>')
    else:
        link=(f'<a class="attachment" href="{atmnt.url}" download><img src="./file.png"><span class="attachmentText">{atmnt.filename}</span></a>')
    return link

def handleEmbeds(message):
    thisFields=""
    index=1
    for i in message.embeds[0].fields:
        thisFields+=(f'''
        <details class="subDet">
            <summary>
                Field {index}: {i.title}
            </summary>
            {i.text}
        </details>
        ''')
        index+=1

    return (f'''
    <details style="background-color: {message.embeds[0].color};" class="detailWrap">
        <summary>
            Title: {message.embeds[0].title}
        </summary>
        <details class="subDet">
            <summary>
                Description
            </summary>
            {message.embeds[0].description}<br>
        </details> 
        <details class="subDet">
            <summary>
                footer
            </summary>
            {message.embeds[0].footer.text}<br>
        </details>
        <details style="padding: 0.5em;" class="subDet">
            <summary>
                Fields:
            </summary>
            {thisFields}
        </details>  
        <details class="subDet">
            <summary>
                Image url: <a href="{message.embeds[0].image.url}">{message.embeds[0].image.url}</a><br>
            </summary>
            <img src="{message.embeds[0].image.url}">
        </details>
        Color hex: {message.embeds[0].color}<br>
        Author: {message.embeds[0].author.name}<br>
        Url: <a href="{message.embeds[0].url}">{message.embeds[0].url}</a><br>
    </details>
    ''')



def logThatShit(message,date,time):
    if not os.path.exists(f"./logs/{message.guild.name}.html"):
        f = open((f"./logs/{message.guild.name}.html"), "w")
        data=open("./logs/log.html","r").read()
        insertpoint=data.find('<div class="wrapper">')+len('<div class="wrapper">')+1
        inputdata=(f'\n<a href="./{message.guild.name}.html" download class="loglink" ><img src="./file.png"><span class="attachmentText">{message.guild.name}</span></a>')
        writedata=data[:insertpoint]+inputdata+data[insertpoint:]
        print(writedata,file=open((f"./logs/log.html"), "w"))

    with open((f"./logs/{message.guild.name}.html"), "r") as userFile:
        data=userFile.read()
        msgattachmentstr=""
        msgembed=""
        if not data.startswith("<!DOCTYPE html>"):
            data=htmlbase

        if len(message.attachments)>0:
            msgattachmentstr=handleAttachments(message)

        if len(message.embeds)>0:
            msgembed=handleEmbeds(message)

        insertpoint=data.find('<div class="wrapper">')+len('<div class="wrapper">')+1
        inputdata=(f'''
            <div class="message {message.channel}">
                {msgattachmentstr}
                <a onclick="hide('{message.channel}')">
                    <span class="guild">
                        {message.guild.name} 
                    </span>
                    <span class="channel">
                        [{message.channel}]:
                    </span>
                </a>
                <span class="date">
                    {date} 
                </span>
                <span class="time">
                    [{time}]: 
                </span>
                <span class="author">
                    {message.author}  
                </span>
                <span class="authorname">
                    ({message.author.name}): 
                </span>
                <span class="content">
                    {message.clean_content}
                </span>
                {msgembed}
            </div>
        ''')
        writedata=data[:insertpoint]+inputdata+data[insertpoint:]
        print(writedata,file=open((f"./logs/{message.guild.name}.html"), "w"))
        # print(data[:insertpoint])
        # print(inputdata)
        # print(data[insertpoint:])

# setup logging
logger = logging.getLogger('discord')
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(filename=f'./botlogs/discord_{datetime.datetime.now().date()}.log', encoding='utf-8', mode='a')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)

# Read token, botversion and midf from a json "data" file
data=json.loads(open("data.json","r").read())
botversion = data["botversion"]
token = data["token"]
midf = data["cmdMod"]

class cmd(): # Use: evaluate command sent by bot admin.
    def __init__(self,midf,message,client):
        self.name=type(self).__name__
        self.message=message
        self.client=client
        self.midf=midf
        self.command=self.message.content[len(self.midf)+len(self.name):]
        self.args=self.command.split(' ')
    
    async def cmd(self):
        if self.message.author.id == 197327976621277184:
            await eval(self.command)
        else:
            await self.message.channel.send("Access denied.")

# starts the discord client.
client = discord.Client()  

@client.event  # event decorator/wrapper. More on decorators here: https://pythonprogramming.net/decorators-intermediate-python-tutorial/
async def on_ready():  # method expected by client. This runs once when connected
    
    # notification of login.
    print(f'''
    Connected: logged in as {client.user}
    Running discord.py version: {discord.__version__}
    Running LogBot version: {botversion}
    ''')  

@client.event
async def on_message(message):  # event that happens per any message.

    # get and format date and time and then output to log.
    dt=datetime.datetime.now() 
    date=dt.date()
    time=dt.time().strftime("%H:%M:%S")
    logThatShit(message,date,time)

    # check if a command was called then run it.
    if message.content[0:len(midf)]==midf:
       await cmd(midf,message,client).cmd()

# Initiate loop. (placed att absolute bottom)
client.run(token,bot=False)
