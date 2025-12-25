//菜谱数据结构
const recipes = [
{
	id: 'basic',//每个菜谱都要有唯一的标识
	name: "经典炊饼",
	unlocked: true,
	price: 6,
	recipe: { flour: 1, ghee: 1},
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
	recipe: { flour: 1, ghee: 1, vegetable: 1},
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
	recipe: { flour: 1, butter: 1, milk: 1},
	hint: "比酥油更高端的那种动物油，据说再来点奶就能变成软到不可思议的云朵之饼！",
	unlockType: 'normal',
	unlockFavor: null,
	img: "images/recipes/cloud.png"
}

];