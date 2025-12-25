
let selectedRecipeMaterials = [];

function renderResearchPanel() {
  const actions = document.getElementById('actions');
  let html = "<div class='research-panel'><b>研发新菜谱</b><br>";
  html += "选择3种不同材料：<br>";
  // 只显示玩家曾经获得过的材料
  Object.keys(materials).forEach(id => {
    const num = materials[id];//修改为用id做主键获取信息
    const info = getMaterialInfo(id);
    const name = info.name;
    const icon = getMaterialIconHtml(id);//获取图片函数

    const isSelected = selectedRecipeMaterials.includes(id);

    html += `<button onclick="selectMaterialForResearch('${id}')" ${isSelected ? "style='background:#cde'" : ""} ${num === 0 ? "disabled" : ""}>${icon}${name} (${num})</button> `;
  });
  html += "<br><br>";
  html += `<button onclick="researchRecipe()" ${selectedRecipeMaterials.length === 3 ? "" : "disabled"}>研发</button>`;
  html += `<button onclick="clearResearchSelection()">清空选择</button>`;
  html += `<button onclick="showBusiness()" style="margin-left:12px;">返回经营</button>`;
  html += "</div>";
  actions.innerHTML = html;
}

function selectMaterialForResearch(id) {//材料选择和清空
  if (!selectedRecipeMaterials.includes(id) && selectedRecipeMaterials.length < 3) {
    selectedRecipeMaterials.push(id);
  } else if (selectedRecipeMaterials.includes(id)) {
    selectedRecipeMaterials = selectedRecipeMaterials.filter(n => n !== id);
  }
  renderResearchPanel();
}

function clearResearchSelection() {
  selectedRecipeMaterials = [];
  renderResearchPanel();
}

function researchRecipe() {
  // 判断是否已有该配方
  const key = selectedRecipeMaterials.slice().sort().join('+');//选中的id拼成字符串key
  let found = null;
  for (let r of recipes) {
    const recipeKey = Object.keys(r.recipe).sort().join('+');
    if (recipeKey === key) {
      found = r;
      break;
    }
  }
  let msg = "";
  if (found) {
    if (found.unlocked) {
      msg = `你尝试用这三种材料，结果发现……这就是「${found.name}」！`;
    } else {
      found.unlocked = true;
      msg = `你成功研发出了新品：「${found.name}」！`;
    }
  } else {
    msg = "这三种材料混在一起，并没有做出新花样……";
  }
  // 材料消耗
  selectedRecipeMaterials.forEach(id => {
    materials[id] -= 1;
    if (materials[id] < 0) materials[id] = 0;
  });
  clearResearchSelection();
  update();
  pushText(msg);
  showResearchPanel(); // 继续停在研发面板
}
