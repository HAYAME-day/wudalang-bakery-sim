//菜谱数据结构
const recipes = [
{
	id: 'basic',//每个菜谱都要有唯一的标识
	name: "经典炊饼",
	unlocked: true,
	price: 6,
	recipe: { flour: 1, ghee: 1},//面粉+酥油
	hint: "经典之选，大众喜爱",
	unlockType: 'normal',
	unlockFavor: null,
	img: "images/recipes/basic.png"
},
{
	id: 'veggie',
	name: "蔬菜脆饼",
	unlocked: false,
	price: 10,
	recipe: { flour: 1, ghee: 1, vegetable: 1},//面粉+酥油+蔬菜
	hint: "普通炊饼加点野菜进去烤脆一点会好吃吗？",
	unlockType: 'normal',
	unlockFavor: null,
	img: "images/recipes/veggie.png"
},
{
	id: 'cloud',
	name: "云朵松饼",
	unlocked: false,
	price: 26,
	recipe: { flour: 1, butter: 1, milk: 1},//面粉+黄油+牛奶
	hint: "比酥油更高端的那种动物油，据说再来点奶就能变成软到不可思议的云朵之饼！",
	unlockType: 'normal',
	unlockFavor: null,
	img: "images/recipes/cloud.png"
},
{
    id: 'layer',
    name: "千层油糕",
    unlocked: false,
    price: 15, 
    recipe: { flour: 1, ghee: 1, sugar: 1 },//面粉+酥油+糖块
    hint: "面粉与酥油的层叠艺术，再来点甜味提鲜。",
    unlockType: 'normal',
    img: "images/recipes/layer.png"
  },
  {
    id: 'soda',
    name: "苏打方脆",
    unlocked: false,
    price: 22, 
    recipe: { flour: 1, bakingSoda: 1, ghee: 1 },//面粉+苏打粉+酥油
    hint: "面粉、油脂和那种白色粉末的奇妙反应。",
    unlockType: 'normal',
    img: "images/recipes/soda.png"
  },
  {
    id: 'scallion',
    name: "葱油饼",
    unlocked: false,
    price: 15, 
    recipe: { flour: 1, ghee: 1, scallion: 1 },//面粉+酥油+大葱
    hint: "葱花碰上热油，激发出最纯粹的香味。",
    unlockType: 'normal',
    img: "images/recipes/scallion.png"
  },
  {
    id: 'scallion_roll',
    name: "葱香花卷",
    unlocked: false,
    price: 26, 
    recipe: { flour: 1, scallion: 1, bakingSoda: 1 },//面粉+大葱+苏打粉
    hint: "想吃软乎的？试试用苏打粉发面，卷上葱花蒸。",
    unlockType: 'normal',
    img: "images/recipes/scallion_roll.png"
  },
  {
    id: 'spicy',
    name: "辣味脆饼",
    unlocked: false,
    price: 18, 
    recipe: { flour: 1, ghee: 1, chili: 1 },//面粉+酥油+辣椒
    hint: "酥油饼上撒把辣椒，劲爆爽口。",
    unlockType: 'normal',
    img: "images/recipes/spicy.png"
  },
  {
    id: 'meat',
    name: "鲜肉火烧",
    unlocked: false,
    price: 22, 
    recipe: { flour: 1, meat: 1, scallion: 1 }, //面粉+肉+大葱
    hint: "肉和葱是绝配，裹进面皮里烤得滋滋冒油。",
    unlockType: 'normal',
    img: "images/recipes/meat.png"
  },
  {
    id: 'egg_wrap',
    name: "鸡蛋卷饼",
    unlocked: false,
    price: 14, 
    recipe: { flour: 1, egg: 1, vegetable: 1 }, //面粉+鸡蛋+蔬菜
    hint: "摊个鸡蛋皮，卷上青菜，营养满分。",
    unlockType: 'normal',
    img: "images/recipes/egg_wrap.png"
  },
  {
    id: 'sugar',
    name: "白糖糕",
    unlocked: false,
    price: 30, 
    recipe: { flour: 1, sugar: 1, bakingSoda: 1 }, //面粉+糖块+苏打粉
    hint: "糖和苏打粉的相遇，蒸出雪白蓬松的甜点。",
    unlockType: 'normal',
    img: "images/recipes/sugar.png"
  },
  {
    id: 'filled',
    name: "果酱夹心",
    unlocked: false,
    price: 48, 
    recipe: { flour: 1, ghee: 1, jam: 1 }, //面粉+酥油+果酱
    hint: "酥脆的油饼中间，夹着珍贵的果酱。",
    unlockType: 'normal',
    img: "images/recipes/filled.png"
  },
  {
    id: 'yolk',
    name: "蛋黄酥",
    unlocked: false,
    price: 30, 
    recipe: { flour: 1, ghee: 1, yolk: 1 }, //面粉+酥油+蛋黄
    hint: "酥油起酥，包入整颗咸蛋黄，富贵逼人。",
    unlockType: 'normal',
    img: "images/recipes/yolk.png"
  },
  {
    id: 'puff',
    name: "奶油泡芙",
    unlocked: false,
    price: 40, 
    recipe: { flour: 1, egg: 1, cream: 1 }, //面粉+鸡蛋+奶油
    hint: "鸡蛋面糊烤空心，挤入满满的奶油。",
    unlockType: 'normal',
    img: "images/recipes/puff.png"
  },
  {
    id: 'moon',
    name: "富贵月饼",
    unlocked: false,
    price: 88, 
    recipe: { flour: 1, snowSugar: 1, yolk: 1 }, //面粉+雪花洋糖+蛋黄
    hint: "雪花洋糖配咸蛋黄，这才是中秋御赐的味道。",
    unlockType: 'normal',
    img: "images/recipes/moon.png"
  }

];