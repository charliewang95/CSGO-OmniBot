Discord = require("discord.js");

exports.findLeastAvailableNumber = (indices) => {
	let num = 1;
	while (num < 1000) {
		if (!indices.includes(num)) {
			return num;
		}
		num++;
	}
	return 0;
}

exports.getExistingCarsString = (cars) => {
	if (cars.length === 0) {
		return "无。";
	}

	let output = "";
	for (let car of cars) {
		let line = `\n**#${car.id}** - ${car.time} ${this.getMembersString(car)} ${this.getTentativeString(car)} ${this.getCoachString(car)}`;
		output += line;
		output += "\n";
	}
	return output;
}

exports.getMembersString = (car) => {
	let output = `\n**成员**：(${car.members.length}/${car.maxMember}) `;
	if (car.members && car.members.length > 0) {
		output += car.members.map(member => member.name).join(", ");
		return output;
	}
	return "";
}

exports.getCoachString = (car) => {
	let output = "\n**观战**：";
	if (car.coach && car.coach.length > 0) {
		output += car.coach.map(member => member.name).join(", ");
		return output;
	}
	return "";
}

exports.getTentativeString = (car) => {
	let output = "\n**待定**：";
	if (car.tentative && car.tentative.length > 0) {
		output += car.tentative.map(member => member.name).join(", ");
		return output;
	}
	return "";
}

exports.createEmbed = (message, color = '#0099ff', footer) => {
  let exampleEmbed = new Discord.MessageEmbed()
    .setColor(color)
	.setDescription(message);
  if (footer) {
	exampleEmbed = exampleEmbed.setFooter(footer);
  }
  return exampleEmbed;
}

exports.getCSGOStats = async (player) => {
	output = ``;
	output += `\n${player?.nickname}`;
	output += `\n-----------------------`;
	output += `\n等级：${player?.games?.csgo?.skillLevel}`;
	output += `\n等级分：${player?.games?.csgo?.faceitElo}`;

	let stats = await player?.games?.csgo?.getStats();
	output += `\nK/D：${stats?.averageKDRatio}`;
	output += `\n爆头率：${stats?.averageHeadshots}%`;
	output += `\n胜率：${stats?.winRate}%`;
	output += `\n近况：${stats?.recentResults.map(result => result == 1 ? '胜' : '负').join("")}`;
	output += `\n-----------------------`;
	return output;
}