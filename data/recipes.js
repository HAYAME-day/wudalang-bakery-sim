//菜谱数据结构
const recipes = [
{
	id: 'basic',//每个菜谱都要有唯一的标识
	name: "经典炊饼",
	unlocked: true,
	recipe: { 面粉: 1, 酥油: 1},
	hint: "经典之选，大众喜爱",
	unlockType: 'normal',
	unlockFavor: null
},
{
	id: 'stuffed',
	name: "蔬菜脆餅",
	unlocked: false,
	recipe: { 面粉: 1, 酥油: 1, 蔬菜: 1},
	hint: "普通炊饼加点野菜进去烤脆一点会好吃吗？",
	unlockType: 'normal',
	unlockFavor: null
}
];