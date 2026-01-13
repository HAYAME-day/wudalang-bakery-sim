//标签词典的映射和转换函数
const tagNames = {
  'basic': '经典',
  'sweet': '甜味',
  'salty': '咸鲜',
  'spicy': '辛辣',
  'sour': '酸爽',
  'bitter': '苦韵',
  'meat': '肉香',
  'veggie': '素食',
  'dainty': '精致',
  'filling': '顶饱',
  'soft': '绵软',
  'crispy': '酥脆',
  'luxury': '名贵',
  'imported': '舶来品',
  'fermented': '发酵品',
  'hot': '烫口',
  'cold': '冰爽',
  'aromatic': '葱香',   
  'rich': '浓郁',
  'milky': '奶香',
  'light': '清淡', 
  'snack': '零嘴'
};
function getTagName(tagId) {
  return tagNames[tagId] || tagId;//找不到对应中文的时候用原ID显示
}