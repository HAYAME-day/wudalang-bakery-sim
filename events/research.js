// research.js

let selectedRecipeMaterials = [];

function renderResearchPanel() {
  // 先列出所有已获得过的材料，点一下就选上（最多选3种）
  let html = "<div class='research-panel'><b>研发新菜谱</b><br>";
  html += "选择3种不同材料：<br>";
  Object.keys(materials).forEach(name => {
    const num = materials[name];
    const isSelected = selectedRecipeMaterials.includes(name);
    html += `<button onclick="selectMaterialForResearch('${name}')" ${isSelected ? "style='background:#cde'" : ""} ${num === 0 ? "disabled" : ""}>${name} (${num})</button> `;
  });
  html += "<br><br>";
  html += `<button onclick="researchRecipe()" ${selectedRecipeMaterials.length === 3 ? "" : "disabled"}>研发</button>`;
  html += `<button onclick="clearResearchSelection()">清空选择</button>`;
  html += "</div>";
  document.getElementById('tab-content-research').innerHTML = html;
}

function selectMaterialForResearch(name) {
  if (selectedRecipeMaterials.includes(name)) {
    // 取消选择
    selectedRecipeMaterials = selectedRecipeMaterials.filter(x => x !== name);
  } else if (selectedRecipeMaterials.length < 3) {
    selectedRecipeMaterials.push(name);
  }
  renderResearchPanel();
}

function clearResearchSelection() {
  selectedRecipeMaterials = [];
  renderResearchPanel();
}

function researchRecipe() {
  if (selectedRecipeMaterials.length !== 3) {
    pushText("请选满三种材料");
    return;
  }
  // 检查材料是否足够
  for (let mat of selectedRecipeMaterials) {
    if (!materials[mat] || materials[mat] < 1) {
      pushText(`${mat}不足，无法研发。`);
      return;
    }
  }
  // 查找是否对应菜谱
  let matched = recipes.find(r => arrayEqual(Object.keys(r.recipe), selectedRecipeMaterials));
  if (matched) {
    if (matched.unlocked) {
      pushText(`你早已掌握了「${matched.name}」，无需重复研发！`);
      return;
    } else {
      // 消耗材料
      selectedRecipeMaterials.forEach(mat => materials[mat] -= 1);
      matched.unlocked = true;
      pushText(`研发成功！你获得了新菜谱：「${matched.name}」`);
      renderRecipeBook && renderRecipeBook();
      renderMaterialBag && renderMaterialBag();
    }
  } else {
    // 未匹配菜谱
    selectedRecipeMaterials.forEach(mat => materials[mat] -= 1);
    pushText("本次研发没能做出新菜谱……");
    renderMaterialBag && renderMaterialBag();
  }
  // 清空选择
  selectedRecipeMaterials = [];
  renderResearchPanel();
}

// 数组内容相等判断，不考虑顺序
function arrayEqual(a, b) {
  if (a.length !== b.length) return false;
  a = a.slice().sort();
  b = b.slice().sort();
  return a.every((v, i) => v === b[i]);
}
