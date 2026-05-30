addLayer("a", {
    name: "跑步",
    symbol: "🏃",
    position: 0,
    row: 0,
    type: "none",
    color: "#4CAF50",
    resource: "跑力",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    update(diff) {
        updateRunning(diff)
        if (!player.isRunning) {
            player.currentStamina = player.currentStamina.add(getBaseStaminaRecovery().times(diff)).min(getBaseStamina())
        }
    },

    tabFormat: [
        ["display-text", function() {
            let lv = player.currentPlayground || player.playgroundLevel
            let pg = getPlaygroundData(lv)
            let rp = calcRunningPower()
            return `<div style="text-align:center;font-size:16px;padding:4px;">
                📍 <b>${pg.name}</b> | 赛道: ${pg.length}m | 跑力值: <b style="color:#FFD700;">${format(rp)}</b>
            </div>`
        }],
        ["display-text", function() {
            let weatherNames = {sunny:"☀️ 晴天", cloudy:"☁️ 阴天", rain:"🌧️ 雨天", wind:"💨 大风", fog:"🌫️ 雾天", snow:"❄️ 雪天"}
            let wt = player.currentWeather
            return `<div style="text-align:center;">🌤 天气: <b>${weatherNames[wt] || "☀️ 晴天"}</b></div>`
        }],
        ["display-text", function() {
            let sta = player.currentStamina
            let staMax = getBaseStamina()
            let ratio = sta.div(staMax).toNumber()
            let barLen = 20
            let filled = Math.floor(ratio * barLen)
            let bar = "█".repeat(filled) + "░".repeat(Math.max(0, barLen - filled))
            let color = ratio > 0.3 ? "#4CAF50" : ratio > 0 ? "#FF9800" : "#F44336"
            return `<div style="text-align:center;font-size:12px;padding:4px;">
                <span style="color:${color}">🫁 耐力: ${format(sta)}/${format(staMax)}</span>
                <span style="font-family:monospace;font-size:11px;letter-spacing:0px;"> ${bar}</span>
                <span style="color:#aaa;"> ${(ratio*100).toFixed(0)}%</span>
            </div>`
        }],
        "blank",
        ["display-text", function() {
            if (player.isRunning && !player._challengeMode) {
                let dist = format(player.runDistance)
                let total = format(player.runTotalDistance)
                let prog = player.runProgress.toNumber().toFixed(1)
                let barLen = 20
                let filled = Math.floor(prog / (100 / barLen))
                let bar = "█".repeat(filled) + "░".repeat(barLen - filled)
                let spd = format(player.currentSpeed)
                let sta = format(player.currentStamina)
                let staMax = format(getBaseStamina())
                let staminaColor = player.currentStamina.div(getBaseStamina()).gte(0.3) ? "#4CAF50" : player.currentStamina.gt(0) ? "#FF9800" : "#F44336"
                return `<div style="text-align:center;padding:8px;">
                    <div style="font-size:22px;color:#4CAF50;">🏃 跑步中...</div>
                    <div style="font-size:14px;">${dist}m / ${total}m</div>
                    <div style="font-family:monospace;font-size:16px;letter-spacing:2px;">${bar}</div>
                    <div style="font-size:14px;">${prog}%</div>
                    <div style="font-size:13px;">⚡速度: ${spd} m/s | <span style="color:${staminaColor}">🫁耐力: ${sta}/${staMax}</span></div>
                </div>`
            }
            if (player.runSettled && !player.isRunning) {
                return `<div style="text-align:center;padding:8px;color:#4CAF50;">
                    <div style="font-size:18px;">✅ 跑步完成！</div>
                    <div style="font-size:16px;">获得 <b>+${format(player.lastRunReward)}</b> 跑步点数(米)</div>
                </div>`
            }
            if (!player.isRunning && !player.runSettled) {
                return `<div style="text-align:center;padding:20px;font-size:18px;color:#aaa;">
                    准备就绪，点击下方按钮开始跑步
                </div>`
            }
            return ""
        }],
        "blank",
        "clickables",
        "blank",
        "h-line",
        ["display-text", function() {
            return `<div style="text-align:center;font-size:16px;padding:6px;"><b>⬆ 属性训练</b> (消耗跑步点数)</div>`
        }],
        ["display-text", function() {
            let spd = getBaseSpeed()
            let sta = getBaseStamina()
            let rec = getBaseStaminaRecovery()
            return `<div style="text-align:center;font-size:13px;color:#aaa;">
                ⚡速度:${format(spd)} | 🫁耐力:${format(sta)} | 🔄恢复:${format(rec)}/s
            </div>`
        }],
        "buyables",
    ],

    clickables: {
        11: {
            title() { return player.isRunning ? "⏹ 停止并结算" : "▶ 开始跑步" },
            display() {
                if (player.isRunning) return "达到目标或点击停止结算; 休息可暂停并恢复耐力"
                let lv = player.currentPlayground || player.playgroundLevel
                let pg = getPlaygroundData(lv)
                return `目标距离: ${pg.length}m | ${pg.surface}`
            },
            canClick() { return true },
            onClick() {
                if (player.isRunning) {
                    stopRunning()
                } else {
                    startRunning()
                }
                player.runSettled = false
            },
            style() { return {
                "min-height": "55px",
                "font-size": "16px",
            }},
        },
        12: {
            title() {
                if (!player.isRunning) return "⏸ 休息 (未跑步)"
                if (player.isResting) return "▶ 继续跑步"
                return "⏸ 休息"
            },
            display() {
                if (!player.isRunning) return "跑步时可暂停以恢复耐力"
                if (player.isResting) {
                    let sta = format(player.currentStamina)
                    let staMax = format(getBaseStamina())
                    return `正在休息恢复耐力... ${sta}/${staMax}`
                }
                return "暂停跑步，缓慢恢复耐力（不会结算）"
            },
            canClick() { return player.isRunning },
            onClick() {
                player.isResting = !player.isResting
            },
            style() { return {
                "min-height": "45px",
                "font-size": "14px",
            }},
        },
    },

    buyables: {
        11: {
            title() {
                let lv = getBuyableAmount('a', 11).add(1)
                return `⚡ 速度训练 Lv.${lv}`
            },
            cost(x) { return getAttributeCost(x.add(1)) },
            display() {
                let lv = getBuyableAmount('a', 11)
                let spd = new Decimal(5).add(lv.times(1))
                let nxt = new Decimal(5).add(lv.add(1).times(1))
                let cost = getAttributeCost(lv.add(1))
                let cap = getAttributeCap()
                let atCap = lv.add(1).gte(cap)
                if (atCap) return `当前速度: ${format(spd)} m/s<br><span style="color:#F44336;">已达上限 (需解锁更高级操场)</span>`
                return `当前速度: ${format(spd)} m/s → ${format(nxt)} m/s<br>消耗: ${format(cost)} 跑步点数(米)`
            },
            canAfford() {
                let lv = getBuyableAmount('a', 11)
                if (lv.add(1).gte(getAttributeCap())) return false
                return player.points.gte(getAttributeCost(lv.add(1)))
            },
            buy() {
                let amt = getBuyableAmount('a', 11)
                let cost = getAttributeCost(amt.add(1))
                player.points = player.points.sub(cost)
                setBuyableAmount('a', 11, amt.add(1))
            },
            buyMax() {
                let amt = getBuyableAmount('a', 11)
                let cap = getAttributeCap()
                while (amt.add(1).lt(cap) && player.points.gte(getAttributeCost(amt.add(1)))) {
                    player.points = player.points.sub(getAttributeCost(amt.add(1)))
                    amt = amt.add(1)
                }
                setBuyableAmount('a', 11, amt)
            },
            purchaseLimit() { return getAttributeCap() },
        },
        12: {
            title() {
                let lv = getBuyableAmount('a', 12).add(1)
                return `🫁 耐力训练 Lv.${lv}`
            },
            cost(x) { return getAttributeCost(x.add(1)) },
            display() {
                let lv = getBuyableAmount('a', 12)
                let sta = new Decimal(100).add(lv.times(20))
                let nxt = new Decimal(100).add(lv.add(1).times(20))
                let cost = getAttributeCost(lv.add(1))
                let cap = getAttributeCap()
                let atCap = lv.add(1).gte(cap)
                if (atCap) return `当前耐力: ${format(sta)}<br><span style="color:#F44336;">已达上限 (需解锁更高级操场)</span>`
                return `当前耐力: ${format(sta)} → ${format(nxt)}<br>消耗: ${format(cost)} 跑步点数(米)`
            },
            canAfford() {
                let lv = getBuyableAmount('a', 12)
                if (lv.add(1).gte(getAttributeCap())) return false
                return player.points.gte(getAttributeCost(lv.add(1)))
            },
            buy() {
                let amt = getBuyableAmount('a', 12)
                let cost = getAttributeCost(amt.add(1))
                player.points = player.points.sub(cost)
                setBuyableAmount('a', 12, amt.add(1))
            },
            buyMax() {
                let amt = getBuyableAmount('a', 12)
                let cap = getAttributeCap()
                while (amt.add(1).lt(cap) && player.points.gte(getAttributeCost(amt.add(1)))) {
                    player.points = player.points.sub(getAttributeCost(amt.add(1)))
                    amt = amt.add(1)
                }
                setBuyableAmount('a', 12, amt)
            },
            purchaseLimit() { return getAttributeCap() },
        },
        13: {
            title() {
                let lv = getBuyableAmount('a', 13).add(1)
                return `🔄 恢复训练 Lv.${lv}`
            },
            cost(x) { return getAttributeCost(x.add(1)) },
            display() {
                let lv = getBuyableAmount('a', 13)
                let rec = new Decimal(2).add(lv.times(0.5))
                let nxt = new Decimal(2).add(lv.add(1).times(0.5))
                let cost = getAttributeCost(lv.add(1))
                let cap = getAttributeCap()
                let atCap = lv.add(1).gte(cap)
                if (atCap) return `当前恢复: ${format(rec)}/s<br><span style="color:#F44336;">已达上限 (需解锁更高级操场)</span>`
                return `当前恢复: ${format(rec)}/s → ${format(nxt)}/s<br>消耗: ${format(cost)} 跑步点数(米)`
            },
            canAfford() {
                let lv = getBuyableAmount('a', 13)
                if (lv.add(1).gte(getAttributeCap())) return false
                return player.points.gte(getAttributeCost(lv.add(1)))
            },
            buy() {
                let amt = getBuyableAmount('a', 13)
                let cost = getAttributeCost(amt.add(1))
                player.points = player.points.sub(cost)
                setBuyableAmount('a', 13, amt.add(1))
            },
            buyMax() {
                let amt = getBuyableAmount('a', 13)
                let cap = getAttributeCap()
                while (amt.add(1).lt(cap) && player.points.gte(getAttributeCost(amt.add(1)))) {
                    player.points = player.points.sub(getAttributeCost(amt.add(1)))
                    amt = amt.add(1)
                }
                setBuyableAmount('a', 13, amt)
            },
            purchaseLimit() { return getAttributeCap() },
        },
    },

    layerShown() { return true },
})

addLayer("g", {
    name: "操场",
    symbol: "🏟",
    position: 1,
    row: 1,
    type: "none",
    color: "#2196F3",
    resource: "操场",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    tabFormat: [
        ["display-text", function() {
            let lv = player.currentPlayground || player.playgroundLevel
            let pg = getPlaygroundData(lv)
            return `<div style="text-align:center;padding:6px;">
                <div style="font-size:20px;color:#FFD700;margin-bottom:4px;">📍 ${pg.name}</div>
                <div style="font-size:12px;color:#aaa;">${pg.surface} · ${pg.curveDesc}</div>
            </div>`
        }],
        ["display-text", function() {
            let lv = player.currentPlayground || player.playgroundLevel
            let pg = getPlaygroundData(lv)
            return `<div style="text-align:center;font-size:12px;line-height:1.8;color:#bbb;padding:4px 12px;font-style:italic;">
                "${pg.desc}"
            </div>`
        }],
        ["display-text", function() {
            let lv = player.currentPlayground || player.playgroundLevel
            let pg = getPlaygroundData(lv)
            return `<div style="text-align:center;font-size:13px;padding:4px;color:#aaa;">
                📏 长度: <b style="color:#fff;">${pg.length}m</b>
                &nbsp;|&nbsp; 🔄 弯道: <b style="color:#fff;">${(pg.curveRatio*100).toFixed(0)}%</b>
            </div>`
        }],
        "blank",
        ["display-text", function() {
            return `<div style="text-align:center;font-size:14px;padding:4px;"><b>🏟 选择训练操场</b></div>`
        }],
        ["row", [["upgrade", 101], ["upgrade", 102]]],
        ["row", [["upgrade", 103], ["upgrade", 104]]],
        ["row", [["upgrade", 105], ["upgrade", 106]]],
        ["row", [["upgrade", 107], ["upgrade", 108]]],
        "blank",
        "h-line",
        ["display-text", function() {
            return `<div style="text-align:center;font-size:14px;padding:6px;"><b>🔓 解锁新操场 (最高已解锁: Lv.${player.playgroundLevel})</b></div>`
        }],
        ["display-text", function() {
            let next = player.playgroundLevel + 1
            if (next > 5) return `<div style="text-align:center;color:#FFD700;">🎉 所有操场已解锁！你是真正的跑者！</div>`
            let pg = PLAYGROUND_DATA[next]
            let rp = calcRunningPower()
            let rpOk = rp.gte(pg.rpReq)
            let ptsOk = player.points.gte(pg.cost)
            return `<div style="text-align:center;font-size:12px;line-height:2;color:#aaa;">
                下一站: <b style="color:#FFD700;">${pg.name}</b><br>
                跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(当前: ${format(rp)})</span><br>
                消耗: ${format(pg.cost)} <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(持有: ${format(player.points)})</span><br>
                赛道: ${pg.length}m · ${pg.surface} · ${pg.curveDesc}
            </div>`
        }],
        "blank",
        "upgrades",
    ],

    upgrades: {
        101: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 1 ? "✅ " : "") + "🏟 学校小操场"
            },
            description: "200m · 煤渣跑道",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(1) },
            onPurchase() { player.currentPlayground = 1 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        102: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 2 ? "✅ " : "") + "🏟 社区跑道"
            },
            description: "400m · 标准塑胶",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(2) },
            onPurchase() { player.currentPlayground = 2 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        103: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 3 ? "✅ " : "") + "🏟 市级运动场"
            },
            description: "800m · 专业沥青",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(3) },
            onPurchase() { player.currentPlayground = 3 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        104: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 4 ? "✅ " : "") + "🏟 省级体育中心"
            },
            description: "1500m · 混合路面",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(4) },
            onPurchase() { player.currentPlayground = 4 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        105: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 5 ? "✅ " : "") + "🏟 马拉松赛道"
            },
            description: "3000m · 城市复合",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(5) },
            onPurchase() { player.currentPlayground = 5 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        106: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 6 ? "✅ " : "") + "🏔 山林越野径"
            },
            description: "5000m · 土路碎石",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(6) },
            onPurchase() { player.currentPlayground = 6 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        107: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 7 ? "✅ " : "") + "⛰ 高海拔训练营"
            },
            description: "8000m · 高原砾石",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(7) },
            onPurchase() { player.currentPlayground = 7 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },
        108: {
            title() {
                let sel = player.currentPlayground || 1
                return (sel === 8 ? "✅ " : "") + "🏆 超马圣殿"
            },
            description: "15000m · 全地形",
            cost: new Decimal(0),
            unlocked() { return player.unlockedPlaygrounds.includes(8) },
            onPurchase() { player.currentPlayground = 8 },
            style() { return {"min-width": "110px", "min-height": "40px", "font-size": "12px"} },
        },

        11: {
            title: "🔓 解锁 Lv.2 社区跑道",
            description() {
                let pg = PLAYGROUND_DATA[2]
                let rp = calcRunningPower()
                let rpOk = rp.gte(pg.rpReq)
                let ptsOk = player.points.gte(pg.cost)
                return `<div style="line-height:1.6;">
                    ${pg.desc}<br><br>
                    跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>
                    消耗: ${format(pg.cost)} 跑步点数(米) <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(${format(player.points)})</span>
                </div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[2].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel < 2 && calcRunningPower().gte(PLAYGROUND_DATA[2].rpReq) },
            onPurchase() {
                player.playgroundLevel = 2
                player.currentPlayground = 2
                if (!player.unlockedPlaygrounds.includes(2)) player.unlockedPlaygrounds.push(2)
            },
        },
        12: {
            title: "🔓 解锁 Lv.3 市级运动场",
            description() {
                let pg = PLAYGROUND_DATA[3]
                let rp = calcRunningPower()
                let rpOk = rp.gte(pg.rpReq)
                let ptsOk = player.points.gte(pg.cost)
                return `<div style="line-height:1.6;">
                    ${pg.desc}<br><br>
                    跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>
                    消耗: ${format(pg.cost)} 跑步点数(米) <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(${format(player.points)})</span>
                </div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[3].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 2 && player.playgroundLevel < 3 && calcRunningPower().gte(PLAYGROUND_DATA[3].rpReq) },
            onPurchase() {
                player.playgroundLevel = 3
                player.currentPlayground = 3
                if (!player.unlockedPlaygrounds.includes(3)) player.unlockedPlaygrounds.push(3)
            },
        },
        13: {
            title: "🔓 解锁 Lv.4 省级体育中心",
            description() {
                let pg = PLAYGROUND_DATA[4]
                let rp = calcRunningPower()
                let rpOk = rp.gte(pg.rpReq)
                let ptsOk = player.points.gte(pg.cost)
                return `<div style="line-height:1.6;">
                    ${pg.desc}<br><br>
                    跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>
                    消耗: ${format(pg.cost)} 跑步点数(米) <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(${format(player.points)})</span>
                </div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[4].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 3 && player.playgroundLevel < 4 && calcRunningPower().gte(PLAYGROUND_DATA[4].rpReq) },
            onPurchase() {
                player.playgroundLevel = 4
                player.currentPlayground = 4
                if (!player.unlockedPlaygrounds.includes(4)) player.unlockedPlaygrounds.push(4)
            },
        },
        14: {
            title: "🔓 解锁 Lv.5 国家级马拉松赛道",
            description() {
                let pg = PLAYGROUND_DATA[5]
                let rp = calcRunningPower()
                let rpOk = rp.gte(pg.rpReq)
                let ptsOk = player.points.gte(pg.cost)
                return `<div style="line-height:1.6;">
                    ${pg.desc}<br><br>
                    跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>
                    消耗: ${format(pg.cost)} 跑步点数(米) <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(${format(player.points)})</span>
                </div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[5].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 4 && player.playgroundLevel < 5 && calcRunningPower().gte(PLAYGROUND_DATA[5].rpReq) },
            onPurchase() {
                player.playgroundLevel = 5
                player.currentPlayground = 5
                if (!player.unlockedPlaygrounds.includes(5)) player.unlockedPlaygrounds.push(5)
            },
        },
        15: {
            title: "🔓 解锁 Lv.6 山林越野径",
            description() {
                let pg = PLAYGROUND_DATA[6]
                let rp = calcRunningPower()
                let rpOk = rp.gte(pg.rpReq)
                let ptsOk = player.points.gte(pg.cost)
                return `<div style="line-height:1.6;">${pg.desc}<br><br>跑力要求: ${pg.rpReq} <span style="color:${rpOk?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>消耗: ${format(pg.cost)} 跑步点数(米) <span style="color:${ptsOk?'#4CAF50':'#F44336'}">(${format(player.points)})</span></div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[6].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 5 && player.playgroundLevel < 6 && calcRunningPower().gte(PLAYGROUND_DATA[6].rpReq) },
            onPurchase() { player.playgroundLevel = 6; player.currentPlayground = 6; if (!player.unlockedPlaygrounds.includes(6)) player.unlockedPlaygrounds.push(6) },
        },
        16: {
            title: "🔓 解锁 Lv.7 高海拔训练营",
            description() {
                let pg = PLAYGROUND_DATA[7]
                let rp = calcRunningPower()
                return `<div style="line-height:1.6;">${pg.desc}<br><br>跑力要求: ${pg.rpReq} <span style="color:${rp.gte(pg.rpReq)?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>消耗: ${format(pg.cost)} 跑步点数(米)</div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[7].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 6 && player.playgroundLevel < 7 && calcRunningPower().gte(PLAYGROUND_DATA[7].rpReq) },
            onPurchase() { player.playgroundLevel = 7; player.currentPlayground = 7; if (!player.unlockedPlaygrounds.includes(7)) player.unlockedPlaygrounds.push(7) },
        },
        17: {
            title: "🔓 解锁 Lv.8 超级马拉松圣殿",
            description() {
                let pg = PLAYGROUND_DATA[8]
                let rp = calcRunningPower()
                return `<div style="line-height:1.6;">${pg.desc}<br><br>跑力要求: ${pg.rpReq} <span style="color:${rp.gte(pg.rpReq)?'#4CAF50':'#F44336'}">(${format(rp)})</span><br>消耗: ${format(pg.cost)} 跑步点数(米)</div>`
            },
            cost: new Decimal(PLAYGROUND_DATA[8].cost),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.playgroundLevel >= 7 && player.playgroundLevel < 8 && calcRunningPower().gte(PLAYGROUND_DATA[8].rpReq) },
            onPurchase() { player.playgroundLevel = 8; player.currentPlayground = 8; if (!player.unlockedPlaygrounds.includes(8)) player.unlockedPlaygrounds.push(8) },
        },
    },

    layerShown() { return true },
})

addLayer("e", {
    name: "装备",
    symbol: "👟",
    position: 2,
    row: 1,
    type: "none",
    color: "#FF9800",
    resource: "装备",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    tabFormat: [
        ["display-text", function() {
            return `<div style="text-align:center;font-size:16px;padding:6px;"><b>👟 运动鞋</b></div>`
        }],
        "blank",
        ["row", [["upgrade", 11], ["upgrade", 12]]],
        ["row", [["upgrade", 13], ["upgrade", 14]]],
        ["row", [["upgrade", 15]]],
        "blank",
        "h-line",
        ["display-text", function() {
            return `<div style="text-align:center;font-size:16px;padding:6px;"><b>👕 运动服</b></div>`
        }],
        "blank",
        ["row", [["upgrade", 21], ["upgrade", 22]]],
        ["row", [["upgrade", 23], ["upgrade", 24]]],
        ["row", [["upgrade", 25]]],
        "blank",
        "h-line",
        ["display-text", function() {
            return `<div style="text-align:center;font-size:16px;padding:6px;"><b>⌚ 运动配饰</b></div>`
        }],
        "blank",
        ["row", [["upgrade", 31], ["upgrade", 32]]],
        ["row", [["upgrade", 33], ["upgrade", 34]]],
        ["row", [["upgrade", 35]]],
    ],

    upgrades: {
        11: {
            title: "👟 普通跑鞋",
            description: "速度 +1",
            cost: new Decimal(500),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.shoes < 1 },
            onPurchase() { player.equipment.shoes = 1 },
        },
        12: {
            title: "👟 轻量跑鞋",
            description: "速度 +2",
            cost: new Decimal(2000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.shoes >= 1 },
            onPurchase() { player.equipment.shoes = 2 },
        },
        13: {
            title: "👟 专业竞速鞋",
            description: "速度 +3，弯道损失 -10%",
            cost: new Decimal(8000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.shoes >= 2 && player.playgroundLevel >= 2 },
            onPurchase() { player.equipment.shoes = 3 },
        },
        14: {
            title: "👟 碳板跑鞋",
            description: "速度 +5，弯道损失 -20%",
            cost: new Decimal(25000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.shoes >= 3 && player.playgroundLevel >= 3 },
            onPurchase() { player.equipment.shoes = 4 },
        },
        15: {
            title: "👟 顶级马拉松鞋",
            description: "速度 +8，弯道损失 -30%",
            cost: new Decimal(80000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.shoes >= 4 && player.playgroundLevel >= 4 },
            onPurchase() { player.equipment.shoes = 5 },
        },
        21: {
            title: "👕 透气T恤",
            description: "耐力消耗 -5%",
            cost: new Decimal(500),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.clothes < 1 },
            onPurchase() { player.equipment.clothes = 1 },
        },
        22: {
            title: "👕 速干运动服",
            description: "耐力消耗 -10%",
            cost: new Decimal(2000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.clothes >= 1 },
            onPurchase() { player.equipment.clothes = 2 },
        },
        23: {
            title: "👕 压缩运动套装",
            description: "耐力消耗 -15%，天气影响 -10%",
            cost: new Decimal(8000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.clothes >= 2 && player.playgroundLevel >= 2 },
            onPurchase() { player.equipment.clothes = 3 },
        },
        24: {
            title: "👕 专业防风套装",
            description: "耐力消耗 -20%，天气影响 -20%",
            cost: new Decimal(25000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.clothes >= 3 && player.playgroundLevel >= 3 },
            onPurchase() { player.equipment.clothes = 4 },
        },
        25: {
            title: "👕 智能温控套装",
            description: "耐力消耗 -25%，天气影响 -35%",
            cost: new Decimal(80000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.clothes >= 4 && player.playgroundLevel >= 4 },
            onPurchase() { player.equipment.clothes = 5 },
        },
        31: {
            title: "⌚ 运动手环",
            description: "资源获取 +5%",
            cost: new Decimal(800),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.accessory < 1 },
            onPurchase() { player.equipment.accessory = 1 },
        },
        32: {
            title: "⌚ 心率监测表",
            description: "资源获取 +10%",
            cost: new Decimal(3000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.accessory >= 1 },
            onPurchase() { player.equipment.accessory = 2 },
        },
        33: {
            title: "⌚ 智能运动手表",
            description: "资源获取 +15%，负面事件 -10%",
            cost: new Decimal(10000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.accessory >= 2 && player.playgroundLevel >= 2 },
            onPurchase() { player.equipment.accessory = 3 },
        },
        34: {
            title: "⌚ 专业跑步配饰包",
            description: "资源获取 +20%，负面事件 -20%",
            cost: new Decimal(30000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.accessory >= 3 && player.playgroundLevel >= 3 },
            onPurchase() { player.equipment.accessory = 4 },
        },
        35: {
            title: "⌚ 精英运动套装",
            description: "资源获取 +30%，负面事件 -30%",
            cost: new Decimal(100000),
            currencyDisplayName: "跑步点数(米)",
            currencyInternalName: "points",
            currencyLayer: "",
            unlocked() { return player.equipment.accessory >= 4 && player.playgroundLevel >= 4 },
            onPurchase() { player.equipment.accessory = 5 },
        },
    },

    layerShown() { return true },
})

addLayer("i", {
    name: "道具",
    symbol: "🎒",
    position: 3,
    row: 1,
    type: "none",
    color: "#9C27B0",
    resource: "道具",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    tabFormat: [
        ["display-text", function() {
            return '<div style="text-align:center;font-size:16px;padding:6px;"><b>🎒 补给商店</b></div>'
        }],
        ["display-text", function() {
            return '<div style="text-align:center;font-size:12px;color:#aaa;">购买道具后，在跑步前激活使用（最多同时2个）</div>'
        }],
        "blank",
        "buyables",
        "blank",
        "h-line",
        ["display-text", function() {
            return '<div style="text-align:center;font-size:16px;padding:6px;"><b>⚡ 激活道具（跑步前使用）</b></div>'
        }],
        ["display-text", function() {
            let active = player.activeItems || []
            if (active.length === 0) return '<div style="text-align:center;color:#aaa;">未激活任何道具</div>'
            let names = active.map(function(id) { return ITEM_DATA[id] ? ITEM_DATA[id].name : id }).join(" + ")
            return '<div style="text-align:center;color:#FFD700;">已激活: ' + names + '</div>'
        }],
        "clickables",
    ],

    buyables: {
        11: {
            title: "🥤 功能饮料",
            cost(x) { return new Decimal(200) },
            display() {
                let qty = player.items.drink || 0
                return "库存: " + qty + " | 效果: 30秒内速度+30%<br>消耗: 200 跑步点数(米)"
            },
            canAfford() { return player.points.gte(200) },
            buy() { player.points = player.points.sub(200); player.items.drink = (player.items.drink || 0) + 1 },
        },
        12: {
            title: "🍬 能量胶",
            cost(x) { return new Decimal(300) },
            display() {
                let qty = player.items.gel || 0
                return "库存: " + qty + " | 效果: 1分钟内耐力消耗-50%<br>消耗: 300 跑步点数(米)"
            },
            canAfford() { return player.points.gte(300) },
            buy() { player.points = player.points.sub(300); player.items.gel = (player.items.gel || 0) + 1 },
        },
        13: {
            title: "🧷 防滑鞋套",
            cost(x) { return new Decimal(400) },
            display() {
                let qty = player.items.grip || 0
                return "库存: " + qty + " | 效果: 抵消雨天/雪天减速50%<br>消耗: 400 跑步点数(米)"
            },
            canAfford() { return player.points.gte(400) },
            buy() { player.points = player.points.sub(400); player.items.grip = (player.items.grip || 0) + 1 },
        },
        14: {
            title: "🧥 防风夹克",
            cost(x) { return new Decimal(400) },
            display() {
                let qty = player.items.jacket || 0
                return "库存: " + qty + " | 效果: 抵消大风耐力消耗50%<br>消耗: 400 跑步点数(米)"
            },
            canAfford() { return player.points.gte(400) },
            buy() { player.points = player.points.sub(400); player.items.jacket = (player.items.jacket || 0) + 1 },
        },
        21: {
            title: "🧪 能量补给块",
            cost(x) { return new Decimal(500) },
            display() {
                let qty = player.items.boost || 0
                return "库存: " + qty + " | 效果: 结算资源+10%<br>消耗: 500 跑步点数(米)"
            },
            canAfford() { return player.points.gte(500) },
            buy() { player.points = player.points.sub(500); player.items.boost = (player.items.boost || 0) + 1 },
        },
        22: {
            title: "💊 高效吸收剂",
            cost(x) { return new Decimal(1000) },
            display() {
                let qty = player.items.absorb || 0
                return "库存: " + qty + " | 效果: 结算资源+20%<br>消耗: 1000 跑步点数(米)"
            },
            canAfford() { return player.points.gte(1000) },
            buy() { player.points = player.points.sub(1000); player.items.absorb = (player.items.absorb || 0) + 1 },
        },
    },

    clickables: {
        11: {
            title() {
                if ((player.activeItems || []).includes("drink")) return "🥤 功能饮料 ✅已激活"
                if ((player.items.drink || 0) <= 0) return "🥤 功能饮料 (无库存)"
                return "🥤 激活功能饮料"
            },
            display() { return "速度+30% 持续30秒" },
            canClick() {
                return (player.items.drink || 0) > 0 && !(player.activeItems || []).includes("drink") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("drink"); player.items.drink -= 1
            },
        },
        12: {
            title() {
                if ((player.activeItems || []).includes("gel")) return "🍬 能量胶 ✅已激活"
                if ((player.items.gel || 0) <= 0) return "🍬 能量胶 (无库存)"
                return "🍬 激活能量胶"
            },
            display() { return "耐力消耗-50% 持续60秒" },
            canClick() {
                return (player.items.gel || 0) > 0 && !(player.activeItems || []).includes("gel") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("gel"); player.items.gel -= 1
            },
        },
        13: {
            title() {
                if ((player.activeItems || []).includes("grip")) return "🧷 防滑鞋套 ✅已激活"
                if ((player.items.grip || 0) <= 0) return "🧷 防滑鞋套 (无库存)"
                return "🧷 激活防滑鞋套"
            },
            display() { return "抵消雨天/雪天减速50%" },
            canClick() {
                return (player.items.grip || 0) > 0 && !(player.activeItems || []).includes("grip") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("grip"); player.items.grip -= 1
            },
        },
        14: {
            title() {
                if ((player.activeItems || []).includes("jacket")) return "🧥 防风夹克 ✅已激活"
                if ((player.items.jacket || 0) <= 0) return "🧥 防风夹克 (无库存)"
                return "🧥 激活防风夹克"
            },
            display() { return "抵消大风耐力消耗50%" },
            canClick() {
                return (player.items.jacket || 0) > 0 && !(player.activeItems || []).includes("jacket") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("jacket"); player.items.jacket -= 1
            },
        },
        21: {
            title() {
                if ((player.activeItems || []).includes("boost")) return "🧪 能量补给块 ✅已激活"
                if ((player.items.boost || 0) <= 0) return "🧪 能量补给块 (无库存)"
                return "🧪 激活能量补给块"
            },
            display() { return "结算资源+10%" },
            canClick() {
                return (player.items.boost || 0) > 0 && !(player.activeItems || []).includes("boost") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("boost"); player.items.boost -= 1
            },
        },
        22: {
            title() {
                if ((player.activeItems || []).includes("absorb")) return "💊 高效吸收剂 ✅已激活"
                if ((player.items.absorb || 0) <= 0) return "💊 高效吸收剂 (无库存)"
                return "💊 激活高效吸收剂"
            },
            display() { return "结算资源+20%" },
            canClick() {
                return (player.items.absorb || 0) > 0 && !(player.activeItems || []).includes("absorb") && (player.activeItems || []).length < 2
            },
            onClick() {
                if (!player.activeItems) player.activeItems = []
                player.activeItems.push("absorb"); player.items.absorb -= 1
            },
        },
    },

    layerShown() { return true },
})

addLayer("ach", {
    name: "成就",
    symbol: "🎖",
    position: 0,
    row: "side",
    type: "none",
    color: "#FFD700",
    resource: "成就",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    tabFormat: [
        ["display-text", function() {
            let done = player.ach.achievements.length
            return '<div style="text-align:center;font-size:15px;padding:6px;"><b>🎖 成就 (' + done + '/30)</b></div>'
        }],
        "blank",
        ["display-text", function() {
            let html = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;">'
            for (let i = 0; i < ACHIEVEMENT_DATA.length; i++) {
                let a = ACHIEVEMENT_DATA[i]
                let done = hasAchievement('ach', getAchId(i))
                let color = done ? '#4CAF50' : '#888'
                let bg = done ? '#132813' : '#181818'
                let bd = done ? '#4CAF50' : '#333'
                html += '<div style="width:135px;padding:6px 4px;background:' + bg + ';border:1px solid ' + bd + ';border-radius:4px;text-align:center;font-size:11px;">'
                html += '<div style="color:' + color + ';font-weight:bold;">' + (done ? '✅ ' : '') + a.name + '</div>'
                html += '<div style="color:#777;font-size:10px;margin-top:2px;">' + a.tooltip + '</div>'
                html += '</div>'
            }
            html += '</div>'
            return html
        }],
    ],

    achievements: {},
    layerShown() { return true },
})

;(function initAchLayer() {
    for (let i = 0; i < ACHIEVEMENT_DATA.length; i++) {
        let id = getAchId(i)
        let idx = i
        layers.ach.achievements[id] = {
            name: ACHIEVEMENT_DATA[idx].name,
            tooltip: ACHIEVEMENT_DATA[idx].tooltip,
            done: function() { return ACHIEVEMENT_DATA[idx].done() },
            unlocked: function() { return true },
            onComplete: function() {},
        }
    }
})()

addLayer("ch", {
    name: "挑战",
    symbol: "🏆",
    position: 5,
    row: 1,
    type: "none",
    color: "#FF5722",
    resource: "挑战",

    startData() { return {
        unlocked: true,
        points: new Decimal(0),
    }},

    update(diff) {
        if (player.isRunning && player._challengeMode) {
            updateRunning(diff)
            if (!player.isRunning && player._challengeMode) {
                if (player._challengeMode === "half" && player.runDistance.gte(21097)) {
                    player.halfMarathonDone = true
                }
                if (player._challengeMode === "full" && player.runDistance.gte(42195)) {
                    player.marathonDone = true
                }
                player._challengeMode = null
                player.currentPlayground = player.playgroundLevel || 1
            }
        }
    },

    tabFormat: [
        ["display-text", function() {
            return `<div style="text-align:center;font-size:18px;padding:8px;"><b>🏆 挑战关卡</b></div>`
        }],
        ["display-text", function() {
            return `<div style="text-align:center;font-size:12px;color:#aaa;">完成挑战获得荣誉称号（挑战中可休息恢复耐力）</div>`
        }],
        "blank",
        ["display-text", function() {
            let hm = player.halfMarathonDone ? "✅" : "⬜"
            let m = player.marathonDone ? "✅" : "⬜"
            return `<div style="text-align:center;line-height:2;font-size:14px;">
                ${hm} 半程马拉松 (21,097m) &nbsp;&nbsp; ${m} 全程马拉松 (42,195m)
            </div>`
        }],
        "blank",
        "clickables",
        "blank",
        "h-line",
        ["display-text", function() {
            if (player.isRunning && player._challengeMode) {
                let dist = format(player.runDistance)
                let total = format(player.runTotalDistance)
                let prog = player.runProgress.toNumber().toFixed(1)
                let barLen = 30
                let filled = Math.floor(prog / (100 / barLen))
                let bar = "█".repeat(filled) + "░".repeat(Math.max(0, barLen - filled))
                let spd = format(player.currentSpeed)
                let sta = format(player.currentStamina)
                let mode = player._challengeMode === "half" ? "半马" : "全马"
                return `<div style="text-align:center;padding:6px;">
                    <div style="font-size:18px;color:#FF5722;">🏆 ${mode}挑战中...</div>
                    <div style="font-size:13px;">${dist}m / ${total}m</div>
                    <div style="font-family:monospace;font-size:14px;">${bar}</div>
                    <div style="font-size:13px;">${prog}%</div>
                    <div style="font-size:12px;">⚡${spd} m/s | 🫁${format(sta)}</div>
                </div>`
            }
            return ""
        }],
    ],

    clickables: {
        11: {
            title() { return player.halfMarathonDone ? "🥈 半程马拉松 ✅" : "🥈 挑战半程马拉松" },
            display() {
                if (player.halfMarathonDone) return "恭喜！你已征服半程马拉松！"
                return "距离: 21,097m | 需解锁 Lv.5+ 操场<br>挑战模式中可使用休息恢复耐力"
            },
            canClick() { return player.playgroundLevel >= 5 && !player.halfMarathonDone && !player.isRunning },
            onClick() {
                rollWeather()
                player._challengeMode = "half"
                player.isRunning = true; player.isResting = false
                player.runProgress = new Decimal(0); player.runDistance = new Decimal(0)
                player.runTotalDistance = new Decimal(21097)
                player.runStartTime = Date.now(); player.runSettled = false
                if (player.currentStamina.lt(20)) player.currentStamina = new Decimal(20)
                player.currentSpeed = getBaseSpeed()
                triggeredEventsThisRun = []; player.itemTimers = {}
            },
            style() { return {"min-height":"70px","font-size":"15px"} },
        },
        12: {
            title() { return player.marathonDone ? "🥇 全程马拉松 ✅" : "🥇 挑战全程马拉松" },
            display() {
                if (player.marathonDone) return "恭喜！你已征服全程马拉松！"
                return "距离: 42,195m | 需解锁 Lv.6+ 操场<br>挑战模式中可使用休息恢复耐力"
            },
            canClick() { return player.playgroundLevel >= 6 && !player.marathonDone && !player.isRunning },
            onClick() {
                rollWeather()
                player._challengeMode = "full"
                player.isRunning = true; player.isResting = false
                player.runProgress = new Decimal(0); player.runDistance = new Decimal(0)
                player.runTotalDistance = new Decimal(42195)
                player.runStartTime = Date.now(); player.runSettled = false
                if (player.currentStamina.lt(20)) player.currentStamina = new Decimal(20)
                player.currentSpeed = getBaseSpeed()
                triggeredEventsThisRun = []; player.itemTimers = {}
            },
            style() { return {"min-height":"70px","font-size":"15px"} },
        },
        13: {
            title() {
                if (!player.isRunning || !player._challengeMode) return "⏸ 休息 (无挑战)"
                if (player.isResting) return "▶ 继续挑战"
                return "⏸ 休息恢复"
            },
            display() {
                if (!player.isRunning || !player._challengeMode) return "挑战跑步时可暂停"
                if (player.isResting) return "休息中...耐力恢复中"
                return "暂停挑战，恢复耐力"
            },
            canClick() { return player.isRunning && player._challengeMode },
            onClick() { player.isResting = !player.isResting },
            style() { return {"min-height":"45px","font-size":"14px"} },
        },
        14: {
            title() { return "⏹ 放弃挑战" },
            display() { return "中止当前挑战（不结算）" },
            canClick() { return player.isRunning && player._challengeMode },
            onClick() {
                player.isRunning = false; player.isResting = false
                player.runSettled = false; player.runProgress = new Decimal(0)
                player._challengeMode = null
                player.currentPlayground = player.playgroundLevel || 1
            },
            style() { return {"min-height":"45px","font-size":"14px"} },
        },
    },

    layerShown() { return true },
})
