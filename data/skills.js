//角色技能
window.characterSkills = {
	'jinlian':{
		name:"回眸一笑",
		description:"下一次上菜强制完美评价，且收益翻倍。",
		unlockFav:20,
		activate:function() {
			window.jinlianBuffAction=true;
			return {success:true,msg:"💖 娘子回眸一笑，下次服务收益翻倍！"};
		}
	},
	'wusong': {
        name: "护佑",
        description: "再次获得本局目前为止最高的一笔单次收入。",
        unlockFav: 20,
        activate: function() {
            // shiftMaxRecord 在 counterGame.js 里维护
            if (window.shiftMaxRecord && window.shiftMaxRecord.money > 0) {
                window.addMoney(window.shiftMaxRecord.money);
                window.addReputation(window.shiftMaxRecord.rep);
                return { 
                    success: true, 
                    msg: `🐯 武二郎护佑，追回大单：+${window.shiftMaxRecord.money}文！` 
                };
            } else {
                return { success: false, msg: "还没开张呢，二郎不知道该护佑啥……" };
            }
        }
    },
    'ximen': {
        name: "公子买单",
        description: "清空当前排队的所有客人，每人按 20 文结算。",
        unlockFav: 20,
        activate: function() {
            // 访问全局的排队数组
            if (!window.currentCustomers || window.currentCustomers.length === 0) {
                return { success: false, msg: "没人排队，西门大官人觉得没面子。" };
            }
            
            let count = window.currentCustomers.length;
            let buyoutPrice = 20;
            let total = count * buyoutPrice;
            
            window.addMoney(total);
            window.clearQueue(); // 调用清空队列函数
            
            return { 
                success: true, 
                msg: `💸 西门大官人打发了 ${count} 人，入账 ${total}文！` 
            };
        }
    }
};
window.addMoney=function(amount) {
	if(typeof money !=='undefined') {
		money += amount;
		if(typeof shiftScore !== 'undefined')
			shiftScore += amount;
		let scoreEl = document.getElementById('biz-score');
		if(scoreEl) scoreEl.textContent = shiftScore;
	}
};
window.addReputation = function(amount) {
	if(typeof reputation !== 'undefined')
		reputation += amount;
};