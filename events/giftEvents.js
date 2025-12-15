      const jinlianGiftPool = [//给金莲的礼物池，从中随机抽选
        {
          name: "木头兔子", cost: 3,
          reactions: [
            { prob: 0.6, favor: 1, text: "木匠雕刻的兔子栩栩如生，摸起来也润泽光滑……金莲直拉着你的手抚摸到他自己脸上去，得意地问你有没有本事找到个像他一样摸起来好的。",log:"金莲喜欢礼物，好感度+1" },
            { prob: 0.4, favor: 2, text: "木匠可能是赶着收工，这个小兔子便雕得不大好，边边角角仍带了些棱角没磨平实。你提醒金莲别拿的时候扎到手，金莲甜甜笑，说着：“官人倒是个会疼人的…有这份心意，奴家就很满足了。”" ,log:"金莲喜欢礼物，好感度+2"}
          ]
        },
        {
          name: "雕花发簪", cost: 5,
          reactions: [
            { prob: 0.7, favor: 4, text: "雕花师傅超常发挥，金莲说这簪子比自己带来的嫁妆还要精致许多，捏着上面金灿灿的小花爱不释手。明明只是鎏金而已……",log:"金莲喜欢礼物，好感度+4" },
            { prob: 0.3, favor: 0, tsundere:true, text: "雕花师傅正常发挥，簪子上的花也算得上是精致。但你拿回家给金莲，金莲却横了你一眼：“官人今天晚了半个时辰才回家，可叫奴家好等。就为了这一根和奴家的嫁妆没多大区别的小玩意儿吗？官人便把它丢到奴家妆奁的最底下去就是了。”似乎因为你的晚归，金莲不大高兴，晚上非要像八爪鱼一样缠着你睡。",log:"金莲使小性子，好感度+0" }
          ]
        },
        {
          name: "肉包", cost: 2,
          reactions: [
            { prob: 0.5, favor: 1, text: "你收摊的时候便买了城里总排队的那家肉包回去，还专门揣在怀里给金莲带回家。金莲惊喜地凑上来，捏着热乎乎还有些烫人的包子：“奴家最爱吃肉包子的皮了！官人怎么晓得的？”", log:"金莲喜欢礼物，好感度+1"},
            { prob: 0.5, favor: 0, tsundere:true, text: "你揣着热乎乎包子回来，金莲动了动鼻翼，牙齿咬了咬下唇，嘟哝着：“奴家在减肥呢……”",log:"金莲使小性子，好感度+0" }
          ]
        }
//继续加加加……
      ];


let jinlianTsundereCount = 0;

      function giveGiftResult(gift) {//给金莲礼物的结果，金莲有概率使小性子，感觉其实也可以使小性子后给加个隐藏数值，然后到达三次以后反而给整个大的！
        if (money<gift.cost) {//没有钱
          pushText("囊中羞涩……");
          log("余额不足，没能给金莲买礼物。");
          nextTime();
          return;
        }
        money-=gift.cost;
        //随机出金莲对礼物的反应
        let roll = Math.random(), acc = 0, selected = gift.reactions[0];
        for (let r of gift.reactions) {
          acc += r.prob;
          if (roll < acc) { selected = r; break; }
        }
        favors[0].value += selected.favor;
        log(selected.log); // 直接输出reaction里写好的log内容
        pushText(`你送给金莲一份${gift.name}。${selected.text}`);
        //判定金莲使小性子次数是否满3次
        if (selected.tsundere) {
          jinlianTsundereCount++;
          if (jinlianTsundereCount >= 3) {
      // 清零并触发特殊事件
            jinlianTsundereCount = 0;
            setTimeout(()=>{
              log("金莲使小性子累计3次，触发隐藏事件，好感度+6");
              pushText("你在家里帮金莲把晾晒好的衣服叠起来的时候，金莲忽然在你转身时悄悄拉了下你的袖子，小声道：“比起礼物，奴家更爱重官人能记住奴家喜欢什么的这份心意。”趁着你感动的时候金莲一下子就凑了上来讨吻。这吻和他平日里那端庄个性完全不一样，恨不得像个章鱼成精一样嗦溜你。\n你摸着自己红肿的嘴唇的时候，金莲才满意地对着梳妆台装模作样整理衣服：“奴家的胭脂都被官人吃掉了……”*也不知道究竟是谁在被吃！*");
        favors[0].value += 6; // 或任意你想要的好感加成
        update();
      }, 400); // 延时让特殊事件出现在主剧情之后
          }
        }
        update();
        nextTime();
      }

