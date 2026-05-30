let modInfo = {
	name: "the running tree",
	author: "陈风就是浪",
	pointsName: "跑步点数(米)",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(0), // Used for hard resets and new players
	offlineLimit: 0,  // In hours
}

let VERSION = {
	num: "0.0.1",
	name: "The running Tree",
}

let changelog = `<h1>更新日志:</h1><br>
	<h3>v0.0.1</h3><br>
		创建了文件夹<br>
		或许你也跑过步，不妨玩一下<br>`

let winText = `恭喜！你已经征服了所有操场，成为了真正的跑步之王！`

var doNotCallTheseFunctionsEveryTick = ["startRunning", "stopRunning", "settleRun"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

function canGenPoints(){
	return false
}

function getPointGen() {
	return new Decimal(0)
}


function getAttributeCap() {
	let caps = [0, 10, 20, 35, 55, 80, 120, 180, 250]
	let lv = Math.min(player.playgroundLevel, caps.length - 1)
	return caps[lv] || 250
}

function getAttributeCost(level) {
	let base = new Decimal(100).times(new Decimal(level).div(2))
	let factor = new Decimal(1).add(new Decimal(level).div(20))
	return base.times(factor).floor()
}

function calcRunningPower() {
	if (!player) return new Decimal(0)
	let spd = getBaseSpeed()
	let sta = getBaseStamina()
	let rec = getBaseStaminaRecovery()
	return spd.times(0.4).add(sta.times(0.4)).add(rec.times(0.2)).floor()
}

function getBaseSpeed() {
	let lv = getBuyableAmount('a', 11)
	let base = new Decimal(3).add(lv.times(0.8))
	let eqLv = player.equipment.shoes
	if (eqLv > 0 && EQUIPMENT_DATA.shoes[eqLv]) {
		base = base.add(EQUIPMENT_DATA.shoes[eqLv].speedBonus)
	}
	let pg = getPlaygroundData(player.currentPlayground || player.playgroundLevel)
	if (pg.speedBonus) base = base.add(pg.speedBonus)
	return base
}

function getBaseStamina() {
	let lv = getBuyableAmount('a', 12)
	return new Decimal(100).add(lv.times(20))
}

function getBaseStaminaRecovery() {
	let lv = getBuyableAmount('a', 13)
	return new Decimal(2).add(lv.times(0.5))
}

function getStaminaSave() {
	let eqLv = player.equipment.clothes
	if (eqLv > 0 && EQUIPMENT_DATA.clothes[eqLv]) {
		return EQUIPMENT_DATA.clothes[eqLv].staminaSave || 0
	}
	return 0
}

function getWeatherProtect() {
	let protect = 0
	let clv = player.equipment.clothes
	if (clv > 0 && EQUIPMENT_DATA.clothes[clv]) {
		protect += EQUIPMENT_DATA.clothes[clv].weatherProtect || 0
	}
	return protect
}

function getEquipmentResourceBonus() {
	let bonus = 0
	let alv = player.equipment.accessory
	if (alv > 0 && EQUIPMENT_DATA.accessory[alv]) {
		bonus += EQUIPMENT_DATA.accessory[alv].resourceBonus || 0
	}
	return bonus
}

function getCurveProtection() {
	let eqLv = player.equipment.shoes
	if (eqLv > 0 && EQUIPMENT_DATA.shoes[eqLv]) {
		return EQUIPMENT_DATA.shoes[eqLv].curveBonus || 0
	}
	return 0
}


var PLAYGROUND_DATA = {
	1: {
		name: "学校小操场",
		length: 200,
		curveRatio: 0.05,
		rpReq: 0,
		cost: 0,
		desc: "一条朴素的 200 米环形跑道，地面是压实的煤渣，踩上去沙沙作响。跑道外围种着几棵梧桐树，树荫恰好遮住直道的一半。这是你跑步之旅的起点。",
		surface: "煤渣跑道",
		curveDesc: "仅有一个平缓弯道",
		speedBonus: 0,
	},
	2: {
		name: "社区跑道",
		length: 400,
		curveRatio: 0.15,
		rpReq: 50,
		cost: 1000,
		desc: "标准的 400 米塑胶跑道，红色跑道在阳光下泛着光泽。跑道画着清晰的白色分界线，每 100 米有一个标记。",
		surface: "标准塑胶",
		curveDesc: "两个标准弯道",
		speedBonus: 1.5,
	},
	3: {
		name: "市级运动场",
		length: 800,
		curveRatio: 0.30,
		rpReq: 150,
		cost: 5000,
		desc: "专业级别的 800 米赛道，沥青材质弹性十足。弯道半径更小、角度更急，连续弯道之间穿插着短直道。",
		surface: "专业沥青",
		curveDesc: "连续急弯 + 短直道",
		speedBonus: 3,
	},
	4: {
		name: "省级体育中心",
		length: 1500,
		curveRatio: 0.40,
		rpReq: 350,
		cost: 20000,
		desc: "1500 米的复合赛道气势恢宏。这里混合了塑胶直道、沥青弯道和一段松软的草地越野段。",
		surface: "混合路面",
		curveDesc: "弯道 + 上坡 + 下坡",
		speedBonus: 5,
	},
	5: {
		name: "国家级马拉松赛道",
		length: 3000,
		curveRatio: 0.50,
		rpReq: 700,
		cost: 80000,
		desc: "3000 米的国标赛道，蜿蜒穿过城市的街道与公园，路面在柏油、石板、木栈道之间变幻。",
		surface: "城市复合路面",
		curveDesc: "复杂弯道 + 地形起伏",
		speedBonus: 8,
	},
	6: {
		name: "山林越野径",
		length: 5000,
		curveRatio: 0.55,
		rpReq: 1500,
		cost: 200000,
		desc: "5000 米的山林越野赛道，树根盘错的泥土小路，碎石散落的陡坡，溪流旁的湿滑石板——每一步都是与自然的博弈。",
		surface: "山林土路 + 碎石 + 溪岸",
		curveDesc: "陡坡 + 树根 + 碎石路段",
		speedBonus: 12,
	},
	7: {
		name: "高海拔训练营",
		length: 8000,
		curveRatio: 0.60,
		rpReq: 3500,
		cost: 500000,
		desc: "海拔 3000 米的高原训练赛道，稀薄的空气让你每一口呼吸都弥足珍贵。远处的雪山在阳光下闪耀，你的身影在高原草甸上投下长长的影子。",
		surface: "高原草甸 + 砾石",
		curveDesc: "长坡 + 高原缺氧 + 急弯",
		speedBonus: 16,
	},
	8: {
		name: "超级马拉松圣殿",
		length: 15000,
		curveRatio: 0.65,
		rpReq: 8000,
		cost: 1500000,
		desc: "15000 米的超级赛道，穿越沙漠边缘、峡谷裂缝、古老森林和海岸悬崖。这是跑者的终极朝圣之路，只有最强的意志才能征服。",
		surface: "全地形复合",
		curveDesc: "沙漠 + 峡谷 + 森林 + 悬崖",
		speedBonus: 22,
	},
}

function getPlaygroundData(level) {
	return PLAYGROUND_DATA[level] || PLAYGROUND_DATA[1]
}


var EQUIPMENT_DATA = {
	shoes: {
		1: { name: "普通跑鞋", speedBonus: 1, cost: 500, playgroundReq: 1, desc: "速度 +1" },
		2: { name: "轻量跑鞋", speedBonus: 2, cost: 2000, playgroundReq: 1, desc: "速度 +2" },
		3: { name: "专业竞速鞋", speedBonus: 3, curveBonus: 0.1, cost: 8000, playgroundReq: 2, desc: "速度 +3，弯道速度损失 -10%" },
		4: { name: "碳板跑鞋", speedBonus: 5, curveBonus: 0.2, cost: 25000, playgroundReq: 3, desc: "速度 +5，弯道速度损失 -20%" },
		5: { name: "顶级马拉松鞋", speedBonus: 8, curveBonus: 0.3, cost: 80000, playgroundReq: 4, desc: "速度 +8，弯道速度损失 -30%" },
	},
	clothes: {
		1: { name: "透气T恤", staminaSave: 0.05, cost: 500, playgroundReq: 1, desc: "耐力消耗 -5%" },
		2: { name: "速干运动服", staminaSave: 0.10, cost: 2000, playgroundReq: 1, desc: "耐力消耗 -10%" },
		3: { name: "压缩运动套装", staminaSave: 0.15, weatherProtect: 0.10, cost: 8000, playgroundReq: 2, desc: "耐力消耗 -15%，恶劣天气影响 -10%" },
		4: { name: "专业防风套装", staminaSave: 0.20, weatherProtect: 0.20, cost: 25000, playgroundReq: 3, desc: "耐力消耗 -20%，恶劣天气影响 -20%" },
		5: { name: "智能温控套装", staminaSave: 0.25, weatherProtect: 0.35, cost: 80000, playgroundReq: 4, desc: "耐力消耗 -25%，恶劣天气影响 -35%" },
	},
	accessory: {
		1: { name: "运动手环", resourceBonus: 0.05, cost: 800, playgroundReq: 1, desc: "资源获取 +5%" },
		2: { name: "心率监测表", resourceBonus: 0.10, cost: 3000, playgroundReq: 1, desc: "资源获取 +10%" },
		3: { name: "智能运动手表", resourceBonus: 0.15, eventProtect: 0.10, cost: 10000, playgroundReq: 2, desc: "资源获取 +15%，负面事件概率 -10%" },
		4: { name: "专业跑步配饰包", resourceBonus: 0.20, eventProtect: 0.20, cost: 30000, playgroundReq: 3, desc: "资源获取 +20%，负面事件概率 -20%" },
		5: { name: "精英运动套装", resourceBonus: 0.30, eventProtect: 0.30, cost: 100000, playgroundReq: 4, desc: "资源获取 +30%，负面事件概率 -30%" },
	},
}

var ITEM_DATA = {
	drink:  { name: "🥤 功能饮料",  desc: "30秒内速度 +30%",     cost: 200,  effect: "speed",     value: 0.30, duration: 30 },
	gel:    { name: "🍬 能量胶",    desc: "1分钟内耐力消耗 -50%",  cost: 300,  effect: "stamina",   value: 0.50, duration: 60 },
	grip:   { name: "🧷 防滑鞋套",  desc: "抵消雨天/雪天减速 50%", cost: 400,  effect: "antirain",  value: 0.50, duration: 0 },
	jacket: { name: "🧥 防风夹克",  desc: "抵消大风耐力消耗 50%",  cost: 400,  effect: "antiwind",  value: 0.50, duration: 0 },
	boost:  { name: "🧪 能量补给块", desc: "结算资源 +10%",         cost: 500,  effect: "resource",  value: 0.10, duration: 0 },
	absorb: { name: "💊 高效吸收剂", desc: "结算资源 +20%",         cost: 1000, effect: "resource",  value: 0.20, duration: 0 },
}

var WEATHER_DATA = {
	sunny:  { name: "☀️ 晴天", speedMod: 0,    staminaMod: 0,      desc: "晴空万里，适合跑步", color: "#FFD54F" },
	cloudy: { name: "☁️ 阴天", speedMod: 0,    staminaMod: -0.10,  desc: "凉爽多云，耐力消耗略降", color: "#B0BEC5" },
	rain:   { name: "🌧️ 雨天", speedMod: -0.20, staminaMod: 0.20,  desc: "赛道湿滑，速度和耐力受影响", color: "#42A5F5" },
	wind:   { name: "💨 大风", speedMod: -0.10, staminaMod: 0.15,  desc: "风力较大，逆风影响速度", color: "#90A4AE" },
	fog:    { name: "🌫️ 雾天", speedMod: -0.05, staminaMod: 0.10,  desc: "雾气弥漫，视野受限", color: "#CFD8DC" },
	snow:   { name: "❄️ 雪天", speedMod: -0.30, staminaMod: 0.30,  desc: "赛道积雪，严重影响跑步", color: "#ECEFF1" },
}

function rollWeather() {
	let level = player.playgroundLevel
	let roll = Math.random()
	let probs = {}
	if (level <= 2) {
		probs = { sunny:0.35, cloudy:0.35, rain:0.05, wind:0.10, fog:0.10, snow:0.05 }
	} else if (level <= 4) {
		probs = { sunny:0.25, cloudy:0.25, rain:0.10, wind:0.15, fog:0.15, snow:0.10 }
	} else {
		probs = { sunny:0.15, cloudy:0.15, rain:0.15, wind:0.20, fog:0.20, snow:0.15 }
	}
	let cum = 0
	for (let w in probs) {
		cum += probs[w]
		if (roll < cum) { player.currentWeather = w; return w }
	}
	return "sunny"
}

function getWeatherEffect() {
	let w = WEATHER_DATA[player.currentWeather] || WEATHER_DATA.sunny
	let speedMod = w.speedMod
	let staminaMod = w.staminaMod
	let protect = getWeatherProtect()
	if (protect > 0 && (speedMod < 0 || staminaMod > 0)) {
		speedMod = speedMod * (1 - protect)
		staminaMod = staminaMod * (1 - protect)
	}
	return { speedMod, staminaMod }
}

var RANDOM_EVENTS = [
	{ type:"positive", title:"🏃 找到近道！", desc:"你发现一条捷径，缩短了剩余距离", effect(r) { r.runDistance = r.runDistance.add(r.runTotalDistance.sub(r.runDistance).times(0.1)) }},
	{ type:"positive", title:"⚡ 肾上腺素飙升", desc:"你感到一股力量涌上来！", effect(r) { r.currentSpeed = r.currentSpeed.times(1.2) }},
	{ type:"positive", title:"💨 顺风助力", desc:"一阵顺风推着你前进", effect(r) { r.runDistance = r.runDistance.add(getBaseSpeed().times(5)) }},
	{ type:"negative", title:"🦶 踩到石子", desc:"脚踝轻微扭伤，速度下降", effect(r) { r.currentSpeed = r.currentSpeed.times(0.8) }},
	{ type:"negative", title:"👟 鞋带松了", desc:"需要停下来重新系紧鞋带，耽误了时间", effect(r) { r.runDistance = r.runDistance.sub(getBaseSpeed().times(3)).max(0) }},
	{ type:"negative", title:"💧 路面湿滑", desc:"踩到一小片积水，差点滑倒", effect(r) { r.currentStamina = r.currentStamina.sub(10).max(0) }},
	{ type:"neutral", title:"💧 路面积水", desc:"前方有小范围积水，需要小心通过", effect(r) { if (getCurveProtection() < 0.1) r.currentSpeed = r.currentSpeed.times(0.9) }},
	{ type:"neutral", title:"🍃 落叶堆积", desc:"跑道上有落叶，略微影响步伐", effect(r) { if (getCurveProtection() < 0.05) r.runDistance = r.runDistance.sub(1).max(0) }},
]

let triggeredEventsThisRun = []

function rollRandomEvent(progress) {
	let level = player.playgroundLevel
	let baseProb = 0.30 + (level - 1) * 0.06 // 30% + 6% per level
	let eventProtect = 0
	let alv = player.equipment.accessory
	if (alv > 0 && EQUIPMENT_DATA.accessory[alv]) {
		eventProtect += EQUIPMENT_DATA.accessory[alv].eventProtect || 0
	}

	let w = WEATHER_DATA[player.currentWeather]
	if (w && w.speedMod < -0.1) baseProb += 0.05
	if (w && w.staminaMod > 0.15) baseProb += 0.05

	let positiveWeight = 0.35
	let negativeWeight = 0.35 - eventProtect
	let neutralWeight = 0.30

	if (Math.random() < baseProb) {
		let typeRoll = Math.random()
		let targetType
		if (typeRoll < positiveWeight) targetType = "positive"
		else if (typeRoll < positiveWeight + negativeWeight) targetType = "negative"
		else targetType = "neutral"

		let candidates = RANDOM_EVENTS.filter(e => e.type === targetType)
		if (candidates.length === 0) candidates = RANDOM_EVENTS
		let evt = candidates[Math.floor(Math.random() * candidates.length)]

		if (!triggeredEventsThisRun.includes(evt.title)) {
			triggeredEventsThisRun.push(evt.title)
			return evt
		}
	}
	return null
}

function getItemResourceBonus() {
	let bonus = 0
	if (player.activeItems && player.activeItems.includes("boost")) bonus += 0.10
	if (player.activeItems && player.activeItems.includes("absorb")) bonus += 0.20
	return bonus
}


function calcRunReward(distance, avgSpeed, staminaUsed, weatherType) {
	if (!distance || distance.lte(0)) return new Decimal(0)

	let baseReward = distance.times(0.15)

	let rp = calcRunningPower()
	let currentPg = getPlaygroundData(player.currentPlayground || player.playgroundLevel)
	let rpReq = new Decimal(currentPg.rpReq || 0)

	let rpEff = rp
	if (rpReq.gt(0) && rp.gt(rpReq)) {
		let overflow = rp.sub(rpReq)
		rpEff = rpReq.add(overflow.pow(0.5))
	}
	let rpBonus = baseReward.times(rpEff.div(100)).times(0.3)

	let speedBonus = baseReward.times(avgSpeed.div(10)).times(0.15)

	let weatherBonus = new Decimal(0)
	if (weatherType === "rain") weatherBonus = baseReward.times(0.10)
	if (weatherType === "snow") weatherBonus = baseReward.times(0.20)
	if (weatherType === "wind") weatherBonus = baseReward.times(0.07)
	if (weatherType === "fog")  weatherBonus = baseReward.times(0.05)

	let total = baseReward.add(rpBonus).add(speedBonus).add(weatherBonus)
	let eqBonus = getEquipmentResourceBonus()
	if (eqBonus > 0) total = total.times(new Decimal(1).add(eqBonus))
	return total.floor()
}


function addedPlayerData() { return {
	isRunning: false,
	runProgress: new Decimal(0),       // 0-100 百分比
	runDistance: new Decimal(0),       // 本次跑步已跑距离(米)
	runTotalDistance: new Decimal(0),  // 本次跑步目标总距离
	runStartTime: 0,                   // 开始跑步的时间戳
	runLastTickTime: 0,                // 上次tick时间戳
	currentStamina: new Decimal(100),  // 当前耐力
	currentSpeed: new Decimal(5),      // 当前速度
	runSettled: false,                 // 是否已结算
	lastRunReward: new Decimal(0),     // 上次跑步收益
	isResting: false,                  // 是否在休息

	playgroundLevel: 1,                // 已解锁最高操场等级
	unlockedPlaygrounds: [1],          // 已解锁操场列表
	currentPlayground: 1,              // 当前选择训练的操场

	currentWeather: "sunny",           // sunny/cloudy/rain/wind/fog/snow

	equipment: {
		shoes: 0,      // 运动鞋等级
		clothes: 0,    // 运动服等级
		accessory: 0,  // 配饰等级
	},

	items: {},
	activeItems: [],
	itemTimers: {},
	_lastEventTrigger: "",
	_pendingEvent: null,
	totalRuns: 0,
	completedRuns: 0,
	halfMarathonDone: false,
	marathonDone: false,
	windyRuns: 0,
	rainyRuns: 0,
	snowyRuns: 0,
}}


var displayThings = [
	function() {
		if (player.isRunning) {
			let dist = format(player.runDistance)
			let total = format(player.runTotalDistance)
			let prog = player.runTotalDistance.gt(0)
				? player.runDistance.div(player.runTotalDistance).times(100).toNumber().toFixed(1)
				: 0
			return `🏃 正在跑步... 已跑 ${dist}m / ${total}m (${prog}%)`
		}
		return ""
	},
	function() {
		let rp = calcRunningPower()
		return `💪 跑力值: ${format(rp)} | ⚡速度: ${format(getBaseSpeed())} | 🫁耐力: ${format(getBaseStamina())} | 🔄恢复: ${format(getBaseStaminaRecovery())}`
	},
	function() {
		if (player.lastRunReward && player.lastRunReward.gt(0)) {
			return `📊 上次跑步获得: +${format(player.lastRunReward)} 跑步点数(米)`
		}
		return ""
	}
]

function isEndgame() {
	return player.playgroundLevel >= 8 && player.points.gte(new Decimal("e8"))
}


var ACHIEVEMENT_DATA = [
	{ name:"初次迈步",           tooltip:"首次开始跑步。",             done(){ return player.totalRuns >= 1 }},
	{ name:"坚持就是胜利",       tooltip:"完整跑完 5 次跑步（达到目标距离）。", done(){ return (player.completedRuns || 0) >= 5 }},
	{ name:"跑步成瘾",          tooltip:"完整跑完 20 次跑步。",       done(){ return (player.completedRuns || 0) >= 20 }},
	{ name:"百跑达人",          tooltip:"完整跑完 100 次跑步。",      done(){ return (player.completedRuns || 0) >= 100 }},
	{ name:"初尝胜果",          tooltip:"累计获得 100 跑步点数(米)。", done(){ return player.points.gte(100) }},
	{ name:"小有积蓄",          tooltip:"累计获得 1000 跑步点数(米)。",done(){ return player.points.gte(1000) }},
	{ name:"万元户",            tooltip:"累计获得 10000 跑步点数(米)。",done(){ return player.points.gte(10000) }},
	{ name:"跑步大亨",          tooltip:"累计获得 1e5 跑步点数(米)。", done(){ return player.points.gte(1e5) }},
	{ name:"速度初体验",        tooltip:"速度训练达到 Lv.3。",        done(){ return getBuyableAmount('a',11).gte(2) }},
	{ name:"风一样的速度",       tooltip:"速度训练达到 Lv.10。",       done(){ return getBuyableAmount('a',11).gte(9) }},
	{ name:"耐力觉醒",          tooltip:"耐力训练达到 Lv.3。",        done(){ return getBuyableAmount('a',12).gte(2) }},
	{ name:"铁肺磨练",          tooltip:"耐力训练达到 Lv.10。",       done(){ return getBuyableAmount('a',12).gte(9) }},
	{ name:"恢复达人",          tooltip:"恢复训练达到 Lv.5。",        done(){ return getBuyableAmount('a',13).gte(4) }},
	{ name:"跑力突破",          tooltip:"跑力值达到 100。",          done(){ return calcRunningPower().gte(100) }},
	{ name:"跑力专家",          tooltip:"跑力值达到 500。",          done(){ return calcRunningPower().gte(500) }},
	{ name:"跑力传奇",          tooltip:"跑力值达到 2000。",         done(){ return calcRunningPower().gte(2000) }},
	{ name:"新跑道解锁",        tooltip:"解锁 Lv.2 社区跑道。",       done(){ return player.playgroundLevel >= 2 }},
	{ name:"市级赛场",          tooltip:"解锁 Lv.3 市级运动场。",     done(){ return player.playgroundLevel >= 3 }},
	{ name:"省级舞台",          tooltip:"解锁 Lv.4 省级体育中心。",    done(){ return player.playgroundLevel >= 4 }},
	{ name:"国赛选手",          tooltip:"解锁 Lv.5 国家级马拉松赛道。",done(){ return player.playgroundLevel >= 5 }},
	{ name:"越野先锋",          tooltip:"解锁 Lv.6 山林越野径。",     done(){ return player.playgroundLevel >= 6 }},
	{ name:"高原战士",          tooltip:"解锁 Lv.7 高海拔训练营。",    done(){ return player.playgroundLevel >= 7 }},
	{ name:"超马圣殿",          tooltip:"解锁 Lv.8 超级马拉松圣殿。",  done(){ return player.playgroundLevel >= 8 }},
	{ name:"半程征服者",        tooltip:"完成半程马拉松挑战。",        done(){ return player.halfMarathonDone }},
	{ name:"全程勇士",          tooltip:"完成全程马拉松挑战。",        done(){ return player.marathonDone }},
	{ name:"配齐装备",          tooltip:"解锁全部三类装备各至少 Lv.1。",done(){ return player.equipment.shoes>=1 && player.equipment.clothes>=1 && player.equipment.accessory>=1 }},
	{ name:"全副武装",          tooltip:"全部装备达到 Lv.5。",         done(){ return player.equipment.shoes>=5 && player.equipment.clothes>=5 && player.equipment.accessory>=5 }},
	{ name:"逆风而行",          tooltip:"在大风天气完成一次跑步。",    done(){ return player.windyRuns >= 1 }},
	{ name:"雨中奔跑",          tooltip:"在雨天完成一次跑步。",        done(){ return player.rainyRuns >= 1 }},
	{ name:"风雪无阻",          tooltip:"在雪天完成一次跑步。",        done(){ return player.snowyRuns >= 1 }},
]

function getAchId(index) {
	return Math.floor(index / 5 + 1) * 10 + (index % 5 + 1)
}

function startRunning() {
	if (player.isRunning) return

	rollWeather()

	let pg = getPlaygroundData(player.currentPlayground || player.playgroundLevel)

	player.isRunning = true
	player.isResting = false
	player.runProgress = new Decimal(0)
	player.runDistance = new Decimal(0)
	player.runTotalDistance = new Decimal(pg.length)
	player.runStartTime = Date.now()
	player.runLastTickTime = Date.now()
	if (player.currentStamina.lt(10)) player.currentStamina = new Decimal(10)
	player.currentSpeed = getBaseSpeed()
	player.runSettled = false
	triggeredEventsThisRun = []
	player.itemTimers = {}
}

function stopRunning() {
	if (!player.isRunning) return
	settleRun()
}

function settleRun() {
	let distance = player.runDistance
	let totalTime = Math.max((Date.now() - player.runStartTime) / 1000, 1)
	let avgSpeed = distance.div(totalTime)
	let reward = calcRunReward(distance, avgSpeed, new Decimal(0), player.currentWeather)
	let itemBonus = getItemResourceBonus()
	if (itemBonus > 0) reward = reward.times(new Decimal(1).add(itemBonus))

	player.points = player.points.add(reward)
	player.lastRunReward = reward
	player.isRunning = false
	player.runSettled = true
	player.runProgress = new Decimal(0)
	player.totalRuns = (player.totalRuns || 0) + 1
	let pg = getPlaygroundData(player.currentPlayground || player.playgroundLevel)
	if (!player._challengeMode && distance.gte(player.runTotalDistance)) {
		player.completedRuns = (player.completedRuns || 0) + 1
	}
	if (player._challengeMode === "half" && distance.gte(21097)) player.halfMarathonDone = true
	if (player._challengeMode === "full" && distance.gte(42195)) player.marathonDone = true
	if (player._challengeMode) { player._challengeMode = null; player.currentPlayground = player.playgroundLevel || 1 }
	if (player.currentWeather === "wind") player.windyRuns = (player.windyRuns || 0) + 1
	if (player.currentWeather === "rain") player.rainyRuns = (player.rainyRuns || 0) + 1
	if (player.currentWeather === "snow") player.snowyRuns = (player.snowyRuns || 0) + 1
	player.activeItems = []
	player.itemTimers = {}
}

function updateRunning(diff) {
	if (!player.isRunning) return

	let seconds = diff
	if (seconds <= 0) return

	if (player.isResting) {
		player.currentStamina = player.currentStamina.add(getBaseStaminaRecovery().times(seconds)).min(getBaseStamina())
		return
	}

	let currentStamina = player.currentStamina
	let staminaMax = getBaseStamina()
	let speed = getBaseSpeed()
	let recovery = getBaseStaminaRecovery()

	let weather = getWeatherEffect()

	let itemSpeedBonus = 0
	let itemStaminaSave = 0
	if (player.activeItems) {
		for (let i = 0; i < player.activeItems.length; i++) {
			let itemId = player.activeItems[i]
			let item = ITEM_DATA[itemId]
			if (!item) continue
			if (!player.itemTimers[itemId]) player.itemTimers[itemId] = item.duration
		}
		for (let itemId in player.itemTimers) {
			if (player.itemTimers[itemId] > 0) {
				player.itemTimers[itemId] -= seconds
				let item = ITEM_DATA[itemId]
				if (item) {
					if (item.effect === "speed") itemSpeedBonus += item.value
					if (item.effect === "stamina") itemStaminaSave += item.value
				}
			}
		}
	}

	let staminaRatio = currentStamina.div(staminaMax).max(0).min(1).toNumber()
	let speedFactor = staminaRatio >= 0.3 ? 1 : (0.25 + (staminaRatio / 0.3) * 0.75)
	let fullSpeed = speed.times(1 + weather.speedMod + itemSpeedBonus).max(0.1)
	let effectiveSpeed = fullSpeed.times(speedFactor)
	if (player.activeItems && player.activeItems.includes("grip") &&
		(player.currentWeather === "rain" || player.currentWeather === "snow")) {
		let gripVal = ITEM_DATA.grip.value
		let weatherMod = 1 + weather.speedMod * (1 - gripVal) + itemSpeedBonus
		fullSpeed = speed.times(Math.max(weatherMod, 0.1))
		effectiveSpeed = fullSpeed.times(speedFactor)
	}

	if (currentStamina.gt(0)) {
		let baseStaminaSave = getStaminaSave()
		let totalStaminaSave = baseStaminaSave + itemStaminaSave
		let staminaMod = weather.staminaMod
		if (player.activeItems && player.activeItems.includes("jacket") && player.currentWeather === "wind") {
			staminaMod = staminaMod * (1 - ITEM_DATA.jacket.value)
		}
		let staminaCost = effectiveSpeed.times(seconds).times(0.6)
			.times(new Decimal(1).sub(totalStaminaSave))
			.times(new Decimal(1).add(staminaMod))
		currentStamina = currentStamina.sub(staminaCost).max(0)
		player.currentSpeed = effectiveSpeed
	} else {
		currentStamina = currentStamina.add(recovery.times(seconds).times(0.3)).min(staminaMax)
		player.currentSpeed = speed.times(0.25)
	}

	let actualSpeed = player.currentSpeed
	let moved = actualSpeed.times(seconds)
	player.runDistance = player.runDistance.add(moved)
	player.currentStamina = currentStamina

	if (player.runTotalDistance.gt(0)) {
		player.runProgress = player.runDistance.div(player.runTotalDistance).times(100).min(100)
	}

	let progress = player.runProgress.toNumber()
	if (progress > 0 && (Math.abs(progress - 25) < 1 || Math.abs(progress - 50) < 1 || Math.abs(progress - 75) < 1)) {
		let evt = rollRandomEvent(progress)
		if (evt && player._lastEventTrigger !== progress.toFixed(0)) {
			player._lastEventTrigger = progress.toFixed(0)
			player._pendingEvent = evt
		}
	}

	if (player.runDistance.gte(player.runTotalDistance)) {
		settleRun()
	}
}




var backgroundStyle = {
	"background-color": "#0a0a12",
}

function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

function fixOldSave(oldVersion){
}