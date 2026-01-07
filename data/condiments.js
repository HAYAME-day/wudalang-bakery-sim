// 调料系统定义
// id: 唯一标识
// name: 显示名称
// tags: 赋予食物的标签
// cost: 补充一次耐久度需要的原材料 { materialId: count }
// maxUses: 满耐久度是多少次 (默认5)
// unlocked: 是否初始解锁
const condiments = [
  // --- 基础款 (开局自带) ---
  {
    id: 'salt_jar',
    name: '精盐罐',
    tags: ['salty'],
    cost: { salt: 1 }, // 1个盐补充一罐
    maxUses: 5,
    unlocked: true,
    desc: "撒一点，味觉就醒了。",
    img: "images/condiments/salt_jar.png"
  },
  {
    id: 'sugar_jar',
    name: '糖霜罐',
    tags: ['sweet'],
    cost: { sugar: 1 }, 
    maxUses: 5,
    unlocked: true,
    desc: "生活的苦，需要这点甜来填补。",
    img: "images/condiments/sugar_jar.png"
  },
  {
    id: 'chili_jar',
    name: '辣椒粉',
    tags: ['spicy'],
    cost: { chili: 1 },
    maxUses: 5,
    unlocked: true,
    desc: "红红火火，刺激过瘾！",
    img: "images/condiments/chili_jar.png"
  },

  // --- 进阶款 (需要解锁/合成) ---
  {
    id: 'scallion_oil',
    name: '葱油酱',
    tags: ['aromatic', 'rich'],
    cost: { scallion: 1, ghee: 1 }, // 葱+油
    maxUses: 5,
    unlocked: false, // 需解锁
    desc: "翠绿的葱油，闻着就香。",
    img: "images/condiments/scallion_oil.png"
  },
  {
    id: 'meat_sauce',
    name: '肉沫酱',
    tags: ['meat', 'rich', 'filling'], // 赋予肉属性！
    cost: { meat: 1, ghee: 1 }, // 肉+油
    maxUses: 5,
    unlocked: false, // 需好感度/声望解锁
    desc: "化腐朽为神奇的肉香，素饼也能变肉饼。",
    img: "images/condiments/meat_sauce.png"
  },
  {
    id: 'condensed_milk',
    name: '甜炼乳',
    tags: ['milky', 'luxury', 'sweet'],
    cost: { milk: 1, sugar: 1 }, // 奶+糖
    maxUses: 5,
    unlocked: false,
    desc: "浓缩的奶香，极其珍贵。",
    img: "images/condiments/condensed_milk.png"
  }
];

// 玩家当前的调料库存状态 (存储在存档里)
// 结构: { 'salt_jar': 3, 'sugar_jar': 0 } (数字代表剩余次数)
let playerCondiments = {
    'salt_jar': 5,
    'sugar_jar': 5,
    'chili_jar': 5
};