//修改实现多选逻辑
window.renderRecipeBook = function() {
  let container = document.getElementById('tab-content-recipes');
  if (!container) return;

  container.innerHTML = '';
  //增加顶部计数器，会根据selectedRecipeIds数组的长度显示，选满了就会变成橙色提醒玩家
  let countColor = selectedRecipeIds.length >= maxShopSlots ? "#d35400" : "#4CAF50";

  let header = document.createElement('div');
  header.style.padding = "10px 5px";
  header.style.color = "#8a8a8a";
  header.style.fontSize = "0.9em";
  header.textContent = "点击图标选择今日主打商品：";
  container.appendChild(header);

//布局从单选的table改为div grid
  let grid = document.createElement('div');
  grid.className = 'recipe-grid'; 
  
  recipes.forEach(r => {
    let item = document.createElement('div');
    item.className = 'recipe-icon-card';
    //检查r.id是否存在于被选择的菜谱id数组内并获取其索引位置
    let selectIndex = selectedRecipeIds.indexOf(r.id);
    let isSelected = (selectIndex !== -1);
    
    if (r.unlocked) {
      //已解锁的菜谱才可以被选择
      if (isSelected) item.classList.add('selected');
      //点击菜谱本身不是直接覆盖选项，而是进行切换，而且要阻止冒泡防止侧边栏关闭
      item.onclick = (e) => {
        e.stopPropagation();//很关键，要阻止冒泡才能避免玩家切换一次菜谱选中就收一次侧边栏
        toggleRecipeSelection(r.id);
        //同时也要弹出气泡告知玩家tags
        let tagsText = (r.tags && r.tags.length > 0) ? r.tags.join('，') : '暂无';
        showHintBubble(e, `🏷️ <b>属性</b>: ${tagsText}`);
      };

      //显示序号角标，要显示它是第几个被玩家选的
      let badgeHtml = isSelected 
        ? `<div class="select-badge">${selectIndex + 1}</div>` 
        : '';

      item.innerHTML = `
        <div class="icon-wrapper">
            <img src="${r.img}" class="recipe-img">
            ${badgeHtml}
        </div>
        <div class="recipe-name">${r.name}</div>
        <div class="recipe-price">${r.price}文</div>
      `;

      item.title = `${r.hint}\n需要: ${getRecipeIngredientsText(r)}`;

    } else {
      //未解锁的菜谱不可以被选
      item.classList.add('locked');
      item.style.cursor = "help"; 
      
      item.innerHTML = `
        <div class="icon-wrapper">
            <span style="font-size:24px;opacity:0.3">🔒</span>
        </div>
        <div class="recipe-name">???</div>
        <div class="recipe-price" style="opacity:0">.</div>
      `;
      
      item.onclick = (e) => {
        //文本区显示hint文本
        pushText(`💡 <b>研发线索</b>：${r.hint}`);
        
        //考虑到交互体验，气泡动画显示hint文本
        showHintBubble(e, r.hint);
        //点击时有0.95的缩放反馈
        item.style.transform = "scale(0.95)";
        setTimeout(() => item.style.transform = "", 100);
      };
      
      item.title = "点击查看研发线索";
    }

    grid.appendChild(item);
  });

  container.appendChild(grid);
}

//配方数据的翻译，例如把flour:1,ghee:1,sugar:1变成面粉+酥油+糖

function getRecipeIngredientsText(r) {
  let parts = [];
  for(let key in r.recipe) {
    let info = getMaterialInfo(key);
    parts.push(info.name);
  }
  return parts.join('+');
}

//气泡逻辑
function showHintBubble(e, text) {
    let old = document.querySelector('.hint-bubble');
    if (old) old.remove();

    let bubble = document.createElement('div');
    bubble.className = 'hint-bubble';
    bubble.innerHTML = text;
    
    bubble.style.left = e.clientX + 'px';
    bubble.style.top = (e.clientY - 40) + 'px';

    document.body.appendChild(bubble);

    setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 300);
    }, 2500); 
}

//多选切换函数
function toggleRecipeSelection(id) {
    //先确认此id在不在数组里
    let index = selectedRecipeIds.indexOf(id);
    
    if (index !== -1) {
        //已经在数组里了，玩家目的是取消选择

        //从index处开始删除1个元素
        selectedRecipeIds.splice(index, 1);
        
    } else {
        //不在数组里，玩家目的是选择该id
        
        //检查是否超过了最大选择数限制，初始为2后续可以增长
        if (selectedRecipeIds.length < maxShopSlots) {
            selectedRecipeIds.push(id); //没有满的时候就直接加入
        } else {
            //满了的情况下文字提示
            pushText(`<span style="color:#d35400">⚠️ 摊位摆不下了！先下架一个再选吧。</span>`);
            
            //小的视觉技巧：让顶部的数字放大一下提醒玩家
            let headerCount = document.querySelector("#tab-content-recipes span:last-child");
            if(headerCount) {
                headerCount.style.transform = "scale(1.5)";
                setTimeout(()=> headerCount.style.transform = "scale(1)", 200);
            }
        }
    }
    
    //数据改完后，必须重新渲染界面，才能看到勾选框的变化
    renderRecipeBook();
}
