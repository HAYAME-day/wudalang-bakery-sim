//准备在此处写角色事件
//角色们类似普通客人一样需要上菜服务
window.characters = {
    'jinlian': {
        id: 'jinlian',
        name: '潘金莲',
        emoji: '🍵',
        desc: '你的娘子，小绿茶一只，只要肯为你花心思就好。',
        favorability: 0,
        stage: 1,
        unlocked: true,
        // ★ 新增：高难度口味池 (3 Tags)
        demandPool: [
            { tags: ['sweet', 'dainty', 'soft'], text: "大郎，奴家今日想吃点甜软精致的，别太粗糙。" },
            { tags: ['spicy', 'salty', 'rich'], text: "嘴里没味，想吃点重口的，最好再油润些。" }
        ],
        // ★ 新增：菜品评价 (根据匹配数 0-3)
        foodReactions: {
            0: "居然把奴家的喜好都忘了……",
            1: "还不够……真是的！官人再多在意奴家一点啊！",
            2: "官人是不是经常观察奴家喜欢什么呀……奴家都要害羞了呢~",
            3: "奴家本来还想着减肥呢，这下好了，完全被官人的手艺俘虏了~❤️"
        },
        quotes: [
            "官人，奴家腰好酸~",
            "官人快瞧瞧，奴家这件衣服是不是太素了？",
            "刚才那个路人一直在看……哼，羡慕也没用，奴家是官人的。",
            "哼，官人光顾着做生意，都顾不上看奴家一眼。"
        ],
        skill: {
            name: "回眸一笑",
            desc: "下一次服务必定完美，且收益翻倍。",
            icon: "😘",
            threshold: 20
        }
    },
    'wusong': {
        id: 'wusong',
        name: '武松',
        emoji: '🐯',
        desc: '你的弟弟，威风凛凛的打虎英雄……只不过遇到你的时候，更像一只大猫了。',
        favorability: 0,
        stage: 1,
        unlocked: true,
        demandPool: [
            { tags: ['meat', 'filling', 'salty'], text: "姐姐，我要出远门，来点有肉又抗饿的咸口硬货！" },
            { tags: ['meat', 'spicy', 'hot'], text: "天寒地冻，来份热乎乎的辣肉饼暖暖身子！" }
        ],
        foodReactions: {
            0: "（挠头）这……姐姐，这好像不是我要的啊，不过也能吃。",
            1: "多谢姐姐疼我。",
            2: "味道真好！我就知道以姐姐的手艺必然有一天要去汴京开店的！",
            3: "姐姐若是有朝一日分店满天下，我便也一直随着姐姐去任何角落❤"
        },
        quotes: [
            "姐姐，酒还有吗？就喝一小杯。",
            "那只老虎……我总要再打一只给姐姐做衣裳才好。",
            "县衙的差事真无聊。",
            "姐姐老是看着嫂嫂……也关心关心我这个亲弟弟嘛。"
        ],
        skill: {
            name: "护佑",
            desc: "复刻本局目前为止最高的一笔收入。",
            icon: "🐯",
            threshold: 20
        }
    },
    'ximen': {
        id: 'ximen',
        name: '西门庆',
        emoji: '👁️',
        desc: '县城首富公子……阿嚏，怎么老感觉有什么人在偷看你啊。',
        favorability: 0,
        stage: 1,
        unlocked: true,
        demandPool: [
            { tags: ['luxury', 'sweet', 'dainty'], text: "我、想要甜的……贵一点也没关系……只要是你做的，都很精致漂亮……" },
            { tags: ['imported', 'fermented', 'spicy'], text: "发酵后的……舶来品，西门家有很多……但是只有你的辣味最好……" }
        ],
        foodReactions: {
            0: "只要是你做的……",
            1: "你的手艺果然……",
            2: "我这样的人居然……都能被你记住喜好……",
            3: "爱你❤……不，刚才什么都没说……"
        },
        quotes: [
            "（躲在柱子后面偷看你，完全没注意到自己个头太大露出来了）",
            "那窗户、没、没关严……不是我、偷看……",
            "我没、没跟踪……顺路……而已。",
            "（小声嘀咕）生意好好的样子……她会看见我吗？"
        ],
        skill: {
            name: "公子买单",
            desc: "直接买下全场客人的单（按最低价），清空队列。",
            icon: "💸",
            threshold: 20
        }
    }
};

//全局好感度增加函数
window.addFavorability = function(charId, amount) {
    //安全检查
    if (!window.characters || !window.characters[charId]) {
        console.warn(`⚠️ 试图给不存在的角色 ID [${charId}] 加好感`);
        return;
    }

    //增加数值
    let char = window.characters[charId];
    // 防止 favorability 是 undefined
    char.favorability = (char.favorability || 0) + amount;

    //打印日志方便调试
    console.log(`💕 ${char.name} 好感度 +${amount} (当前: ${char.favorability})`);
    
    //在这里加个飘字提示
    if (window.pushText) {
        window.pushText(`${char.name} 好感度 +${amount}`);
    }
};