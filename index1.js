const TelegramBot = require('node-telegram-bot-api');
const Storage = require('node-storage');
var store = new Storage('data.json');
const token = '615978354:AAHY5rmo8w2vnDkInzxKKzNRv_jfwfLiI0c';
var data = [];
 
const bot = new TelegramBot(token, {polling: true});

var response = {
  hello: 'hello',
}

var keyboards = {
  help: {
    "reply_markup": {"keyboard": [["пары сегодня", "расписание"],   ["покажи пользователей"], ["где универ?"]]}
  },
  schedule: {
    "reply_markup": {"keyboard": [["пн", "вт","ср","чт","пт"]]}
  },
  aorb: {
    "reply_markup": {"keyboard": [["А", "Б"]]}
  },
  groups: {
    "reply_markup": {"keyboard": [["241", "251"]]}
  }
}

var timeTable = ['7:00','9:45','11:25','13:10','14:55','16:35'];
var timeTable1 = ['3:32','3:33','3:34','13:10','14:55','16:35'];

var rasp = {
  '241': {
    1: [['Матан', '5123101'],['Ук13р.Яз','210']],
    2: [['Матан', '501231'],['Укр13.Яз','210']],
    3: [['Матан', '5031232311'],['Укр.Я123з','210']],
    4: [['Матан', '50121'],['Укр123.Яз','210']],
    5: [['Матан', '501231'],['У12кр.Яз','210']],
    6: [['Утро', '7:00'],['Типа первая пара закончилась','9:45'],['Типа 2 пара закончилась','11:25']]
  },
  '251': {

  }
}

const getSchedule = function(day) {
  var result;
  if(day == 'сегодня') {
    result = 'Сегодня пиздец!';
  } else {
    result = 'Не ебу';
  }
  return(result);
};

// Сохраняем пользователя
const addToJson = function(id,user) {
  store.put('users.'+String(id), user);
}

// Вызываем всех пользователей
const getUsers = function(){
  return(store.get('users'));
}

const dayToInt = function(day) {
  var result;
  switch(day){
    case 'пн':
      result = 1;
      break;
    case 'вт':
      result = 2;
      break;
    case 'ср':
      result = 3;
      break;
    case 'чт':
      result = 4;
      break;
    case 'пт':
      result = 5;
      break;
    default:
      result = 1;
  }
  return(result);
}

// Стартуем! Привет и тд 
bot.onText(/\/start/, function (msg) {
    var fromId = msg.from.id;
    bot.sendMessage(msg.chat.id, response.hello, keyboards.groups);
});

// Расписание выбор А или Б
bot.onText(/расписание/, function (msg, day) {
    var fromId = msg.from.id;
    data.push(day[0]);
    bot.sendMessage(msg.chat.id, "Какая неделя?",keyboards.aorb);
});

// Расписание День недели
bot.onText(/А|Б/, function (msg, type) {
    var fromId = msg.from.id;
    data.push(type[0]);
    bot.sendMessage(msg.chat.id, "Какой день?", keyboards.schedule);
});

// Расписание выводим расписание
bot.onText(/пн|вт|ср|чт|пт/, function (msg, type) {
    var fromId = msg.from.id;
    data.push(type[0]);
    var curGroup = getUsers();
    curGroup = curGroup[msg.chat.id]['group'];
    var lesson = rasp[curGroup][dayToInt(type[0])];
    console.log(lesson);
    //bot.sendMessage(msg.chat.id, lesson);
});

// Команды
bot.onText(/команды/, function (msg) {
  bot.sendMessage(msg.chat.id, keyboards.help);
});

// Сохраняем с какой группы человек
bot.onText(/241|251/, function (msg, group) {
  bot.sendMessage(msg.chat.id, "Я запомнил", keyboards.help);
  var data = {user:msg.chat.id, group: group[0]};
  addToJson(msg.chat.id,data);
});

// Возвращаем расписание
bot.onText(/пары (.+)/, function (msg, day) {
  var response;
  var today = new Date().getDay();
    var fromId = msg.from.id;
    var group = store.get('users.'+fromId);
    group = group['group'];
    if(day[1] == 'сегодня') {
      response = rasp[group][today];
    } else if(day[1] == 'завтра' && rasp[group][today]++){
      response = rasp[group][today]++;
    } else {
      response = rasp[group][1];
    }
    var result = ``;
    for(i in response) {
      counter = i;
      result += String(++counter)+'. ' + response[i][0]+' ' + response[i][1] +' ауд.\n';
      console.log(result);
    }
    bot.sendMessage(fromId, result);
});

// Отправляем метку на карте
bot.onText(/где универ\?/,(msg) => {
    bot.sendLocation(msg.chat.id, 46.646381, 32.629923);
    bot.sendMessage(msg.chat.id, 'вулиця Університетська, 27');
});

setInterval(function(){
    var curDate = new Date().getHours() + ':' + new Date().getMinutes();
    var users = getUsers();
    var timeFlag = store.get('timeFlag',timeFlag);

    if(curDate == timeTable[timeFlag]){
      for(user in users) {
        var lesson = rasp[users[user]['group']][new Date().getDay()][timeFlag];
        var toResp = 'След. пара - '+lesson[0]+' в '+ lesson[1]+' ауд.';
        if(timeFlag == 0) {
          toResp = 'Доброе утро... Первая пара пара - '+lesson[0]+' в '+ lesson[1]+' ауд.';
        }
        bot.sendMessage(users[user]['user'], toResp);
      }
      if(timeFlag > timeTable.length) {
        timeFlag = 0;
      } else {
        timeFlag++;
      }
      
      store.put('timeFlag',timeFlag);
    }
},1000);