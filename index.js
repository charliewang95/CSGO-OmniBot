//import * as Utils from "./util.js"
//import * as Discord from "discord.js"
//import Faceit from "faceit-js-api"

Utils = require("./util");
Discord = require("discord.js");
Faceit = require("faceit-js-api");
const client = new Discord.Client();
const faceit = new Faceit("a866a7af-186e-4988-85a8-c1dbd95767e7");

let cars = [];
let indices = [];
let faceitMap = {};
let persistentMessage;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});

client.on("message", (msg) => {
  // 帮助
  if (msg.content === "!help") {
    let message = "车队小助手现有指令：\n" +
                  "!help - 查看指令\n" +
                  "!request <title> - 组建5人车队\n" +
                  "!request <title> <x> - 组建x人车队\n" +
                  "!rename <#> <title> - 给#号车队改名\n" +
                  "!dismiss - 取消已有车队\n" + 
                  "!cars - 查看所有车队\n" + 
                  "!join <#> - 加入#号车队\n" + 
                  "!tentative <#> - 加入#号车队待定席\n" + 
                  "!coach <#> - 加入#号车队观战席\n" +
                  "!quit <#> - 离开#号车队\n" +
                  "!link <faceit_name> - 关联FACEIT账号\n" + 
                  "!stats <faceit_name/discord_name> - 查询FACEIT数据";
    sendMessage(msg, Utils.createEmbed(message));
  }

  //组建新车队
  else if (msg.content.startsWith("!request")) {
    let args = msg.content.split(" ");
    if (args.length == 1) {
      updateMessage(msg, Utils.createEmbed(`请输入队名，如"!request 9:30PM末班车"。`, '#cc0000'));
      return;
    }

    let time = args[1];

    let maxMember = (args.length > 2 && !isNaN(parseInt(args[2]))) ? parseInt(args[2]) : 5;
    if (maxMember < 2) {
      updateMessage(msg, Utils.createEmbed(`车队需要至少两人。`, '#cc0000'));
    } else if (cars.find(car => car.leader === msg.author.username)) {
      updateMessage(msg, Utils.createEmbed(`${msg.author.username}已经拥有一支车队。解散已有车队请用"!dismiss"。`, '#cc0000'));
    } else {
      const index = Utils.findLeastAvailableNumber(indices);
      indices.push(index);
      let car = {
        time,
        maxMember,
        leader: msg.author.username,
        id: index,
        members: [{userid: msg.author.id, name: msg.author.username}],
        coach: [],
        tentative: []
      }
      cars.push(car);
      sendMessage(msg, Utils.createEmbed(`${msg.author.username}开始组建新车队，车队编号: ${index}。`));
      updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));

      setTimeout(() => {
        if (cars.indexOf(car) > -1) {
          cars.splice(cars.indexOf(car), 1);
          indices.splice(indices.indexOf(car.id), 1);
          sendMessage(msg, Utils.createEmbed(`车队${car.id}已被自动解散`, '#cc0000'));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        }
      }, 5*60*60*1000);
    }
  }
  
  //解散已有车队
  else if (msg.content === "!dismiss") { 
    let car = cars.find(car => car.leader === msg.author.username);
    if (!car) {
      updateMessage(msg, Utils.createEmbed(`${msg.author.username}还不是车主。组建车队请用"!request"。`, '#cc0000'));
    } else {
      const currentCarId = car.id;
      cars.splice(cars.indexOf(car), 1);
      indices.splice(indices.indexOf(currentCarId), 1);
      sendMessage(msg, Utils.createEmbed(`车队${currentCarId}已被解散。`, '#cc0000'));
      updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
    }
  }
  
  //查看所有车队
  else if (msg.content === "!cars") {
    updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
  }
  
  //加入已有车队
  else if (msg.content.startsWith("!join")) {
    let args = msg.content.split(" ");
    if (args.length == 1) {
      updateMessage(msg, Utils.createEmbed(`请输入想加入的车队编号，如"!join 1"。查看所有车队请用"!cars"。`, '#cc0000'));
      return;
    }
    let carId = parseInt(args[1]);
    let car = cars.find(car => car.id === carId);
    if (!car) {
      updateMessage(msg, Utils.createEmbed(`车队${carId}不存在。`, '#cc0000'));
    } else if (car.members.find(member => member.userid === msg.author.id)) {
      updateMessage(msg, Utils.createEmbed(`${msg.author.username}已在此车队。`, '#cc0000'));
    } else if (car.members.length === car.maxMembers) {
      updateMessage(msg, Utils.createEmbed(`车队${carId}已满员。`, '#cc0000'));
    } else {
      if (car.tentative.find(member => member.userid === msg.author.id)) {
        let member = car.tentative.find(member => member.userid === msg.author.id)
        car.tentative.splice(car.tentative.indexOf(member), 1);
      } else if (car.coach.find(member => member.userid === msg.author.id)) {
        let member = car.coach.find(member => member.userid === msg.author.id)
        car.coach.splice(car.coach.indexOf(member), 1);
      }
      car.members.push({userid: msg.author.id, name: msg.author.username});
      sendMessage(msg, Utils.createEmbed(`${msg.author.username}已加入车队${carId}。`));
      updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
      if (car.members.length === car.maxMember) {
        sendMessage(msg, Utils.createEmbed(`车队${carId}准备发车。成员：${Utils.getMembersString(car)}`, '#228855'));
        for (let member of car.members) {
          client.users.cache.get(member.userid).send(`车队${carId}准备发车。成员：${Utils.getMembersString(car)}`);
        }
      }
    }
  }
  
  //离开车队
  else if (msg.content.startsWith("!quit")) {
    let args = msg.content.split(" ");
    if (args.length == 1) {
      updateMessage(msg, Utils.createEmbed(`请输入想离开的车队编号，如"!quit 1"。查看所有车队请用"!cars"。`, '#cc0000'));
      return;
    }
    let carId = parseInt(args[1]);
    let car = cars.find(car => car.id === carId);
    if (!car) {
      updateMessage(msg, Utils.createEmbed(`车队${carId}不存在。`, '#cc0000'));
    } else if (car.coach.find(member => member.userid === msg.author.id)) {
      let member = car.coach.find(member => member.userid === msg.author.id);
      car.coach.splice(car.coach.indexOf(member), 1);
      if (car.leader === msg.author.username) {
        if (car.members.length === 0) {
          cars.splice(cars.indexOf(car), 1);
          indices.splice(indices.indexOf(carId), 1);
          sendMessage(msg, Utils.createEmbed(`车队${carId}成员全部离开，车队已被取消。`, '#cc0000'));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        } else {
          car.leader = car.members[0].name;
          sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}, 车主移交给${car.members[0].name}。`));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        }
      } else {
        sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}。`));
        updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
      }
    } else if (car.tentative.find(member => member.userid === msg.author.id)) {
      let member = car.tentative.find(member => member.userid === msg.author.id);
      car.tentative.splice(car.tentative.indexOf(member), 1);
      if (car.leader === msg.author.username) {
        if (car.members.length === 0) {
          cars.splice(cars.indexOf(car), 1);
          indices.splice(indices.indexOf(carId), 1);
          sendMessage(msg, Utils.createEmbed(`车队${carId}成员全部离开，车队已被取消。`, '#cc0000'));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        } else {
          car.leader = car.members[0].name;
          sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}, 车主移交给${car.members[0].name}。`));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        }
      } else {
        sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}。`));
        updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
      }
    } else if (!car.members.find(member => member.userid === msg.author.id)) {
      updateMessage(msg, Utils.createEmbed(`${msg.author.id}不在此车队中。`, '#cc0000'));
    } else {
      let member = car.members.find(member => member.userid === msg.author.id)
      car.members.splice(car.members.indexOf(member), 1);
      if (car.leader === msg.author.username) {
        if (car.members.length === 0) {
          cars.splice(cars.indexOf(car), 1);
          indices.splice(indices.indexOf(carId), 1);
          sendMessage(msg, Utils.createEmbed(`车队${carId}成员全部离开，车队已被取消。`, '#cc0000'));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        } else {
          car.leader = car.members[0].name;
          sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}, 车主移交给${car.members[0].name}。`));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        }
      } else {
        sendMessage(msg, Utils.createEmbed(`${msg.author.username}已离开车队${carId}。`));
        updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
      }
    }
  }

  //观战
  else if (msg.content.startsWith("!coach")) {
    let args = msg.content.split(" ");
    if (args.length == 1) {
      updateMessage(msg, Utils.createEmbed(`请输入想加入的车队编号，如"!coach 1"。查看所有车队请用"!cars"。`, '#cc0000'));
      return;
    }
    let carId = parseInt(args[1]);
    let car = cars.find(car => car.id === carId);
    if (!car) {
      updateMessage(msg, Utils.createEmbed(`车队${carId}不存在。`, '#cc0000'));
    } else if (car.coach.find(member => member.userid === msg.author.id)) {
      updateMessage(msg, Utils.createEmbed(`${msg.author.username}已在此车队中观战。`, '#cc0000'));
    } else {
      if (car.tentative.find(member => member.userid === msg.author.id)) {
        let member = car.tentative.find(member => member.userid === msg.author.id)
        car.tentative.splice(car.tentative.indexOf(member), 1);
      } else if (car.members.find(member => member.userid === msg.author.id)) {
        let member = car.members.find(member => member.userid === msg.author.id)
        car.members.splice(car.members.indexOf(member), 1);
      }
      car.coach.push({userid: msg.author.id, name: msg.author.username});
      sendMessage(msg, Utils.createEmbed(`${msg.author.username}已加入车队${carId}观战席。`));
      updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
    } 
  }

  // 待定席
  else if (msg.content.startsWith("!tentative")) {
    let args = msg.content.split(" ");
    if (args.length < 2) {
      updateMessage(msg, Utils.createEmbed(`请输入想待定的车队编号，如"!tentative 1"。查看所有车队请用"!cars"。`, '#cc0000'));
    } else {
      let carId = parseInt(args[1]);
      let car = cars.find(car => car.id === carId);
      if (!car) {
        updateMessage(msg, Utils.createEmbed(`车队${carId}不存在。`, '#cc0000'));
      } else if (car.tentative.find(member => member.userid === msg.author.id)) {
        updateMessage(msg, Utils.createEmbed(`${msg.author.username}已在此车队待定。`, '#cc0000'));
      } else {
        if (car.members.find(member => member.userid === msg.author.id)) {
          let member = car.members.find(member => member.userid === msg.author.id)
          car.members.splice(car.members.indexOf(member), 1);
        } else if (car.coach.find(member => member.userid === msg.author.id)) {
          let member = car.coach.find(member => member.userid === msg.author.id)
          car.coach.splice(car.coach.indexOf(member), 1);
        }
        car.tentative.push({userid: msg.author.id, name: msg.author.username});
        sendMessage(msg, Utils.createEmbed(`${msg.author.username}已加入车队${carId}待定席。`));
        updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
      } 
    }
  }

  // 改名
  else if (msg.content.startsWith("!rename")) {
    let args = msg.content.split(" ");
    if (args.length < 2) {
      updateMessage(msg, Utils.createEmbed(`请输入想改名的车队编号，如"!rename 1 晚上10:00"。查看所有车队请用"!cars"。`, '#cc0000'));
    } else {
      if (args.length < 3) {
        updateMessage(msg, Utils.createEmbed(`请输入想改名的车队名称，如"!rename 1 晚上10:00"。查看所有车队请用"!cars"。`, '#cc0000'));
      } else {
        let carId = parseInt(args[1]);
        let carName = args[2];
        let car = cars.find(car => car.id === carId);
        if (!car) {
          updateMessage(msg, Utils.createEmbed(`车队${carId}不存在。`, '#cc0000'));
        } else if (!car.members.find(member => member.userid === msg.author.id)) {
          updateMessage(msg, Utils.createEmbed(`${msg.author.username}不在此车队中。`, '#cc0000'));
        } else {
          car.time = carName;
          sendMessage(msg, Utils.createEmbed(`${msg.author.username}把车队${carId}名称改为${carName}。`));
          updateMessage(msg, Utils.createEmbed(`现有车队: ${Utils.getExistingCarsString(cars)}`));
        } 
      }
    }
  }

  // 强制解散
  else if (msg.content.startsWith("!forceremove")) {
    let args = msg.content.split(" ");
    if (args.length < 2 || isNaN(parseInt(args[1]))) return;
    let carId = parseInt(args[1]);
    let car = cars.find(car => car.id === carId);
    cars.splice(cars.indexOf(car), 1);
    indices.splice(indices.indexOf(carId), 1);
    sendMessage(msg, Utils.createEmbed(`车队${carId}已被取消。`, '#cc0000'));
  }

  // 链接FaceIt
  else if (msg.content.startsWith("!link")) {
    let args = msg.content.split(" ");
    if (args.length < 2) {
      updateMessage(msg, Utils.createEmbed(`请输入你的FACEIT昵称，如"!link Dr_Cue"`, '#cc0000'));
    } else {
      faceitMap[msg.author.username] = args[1];
      updateMessage(msg, Utils.createEmbed(`${msg.author.username}已连接FACEIT账号：${args[1]}`));
    }
  }

  // 查询FaceIt
  else if (msg.content.startsWith("!stats")) {
    let args = msg.content.split(" ");
    if (args.length < 2) {
      updateMessage(msg, Utils.createEmbed(`请输入想查找的FACEIT/Discord昵称，如"!stats Dr_Q"。`, '#cc0000'));
    } else {
      let name = args[1];
      let key = Object.keys(faceitMap).includes(name) ? faceitMap[name] : name;
      faceit.getPlayerInfo(key).then(async (player) => {
        if (!player || player == undefined || !player.nickname) {
          updateMessage(msg, Utils.createEmbed(`玩家${name}不存在或未关联FACEIT账号。`, '#cc0000'));
        } else {
          let statsMessage = await Utils.getCSGOStats(player);
          sendMessage(msg, Utils.createEmbed(statsMessage, '#ffa500', `Searched by ${msg.author.username}`));
        }
      });
    }
  }
});

client.login("Nzg1MzY0MjE2OTY5MTY2ODc4.X82xbA.LdvkU9CmuJ5sIHjIW0h4Wd0o1O4")

const sendMessage = (receivedMessage, sentMessage) => {
  receivedMessage.delete();
  receivedMessage.channel.send(sentMessage);
}

const updateMessage = async (receivedMessage, sentMessage) => {
  receivedMessage.delete();
  if (persistentMessage) {
    persistentMessage.delete();
  }
  persistentMessage = await receivedMessage.channel.send(sentMessage);
};
