# validator

### 用于Vue中form表单验证的小插件，只能在webpack环境下使用

#### #使用方式：
    1. 引入JS到项目中
    2. Vue.use(validator)
    3.指令： v-varify

#### #示例：
```
 <input type="password" placeholder="示例" v-model="password"
        required
        effect="parent.2"
        effectClass="form-warning"
        tip="我是required的提示"
        ref="password"
        v-varify:groupname.input.change.blur="[{test:/\d/,tip:'雾霾不好闻',effect:'self',effectClass:'form-warning'}，...]"/> 

 <div class="tip">
    <!-- 提示语 -->
 </div>

 <input type="password" placeholder="简写和equal使用" v-model="repassword"
        required
        :equal="password"
        tip="required的提示|equal的提示"
        v-varify:groupname />

```

#### #说明：

```
1. required，<Boolean>,是否是必填项，只要检测有该属性，则为true
2. equal，<String>, 被相等值, 将会进行[repassword]===[equal]的判断
3. tip, <String>, required和equal的提示语，以|（单竖线）分隔
4. effect，<String>, 值：self（默认）,parent.number（默认1）,作用 effectClass 的位置（节点），number：第number祖元素
5. effectClass, <String>, class类名（只能一个）
6. [提示语]：必须是v-varify所在元素next兄弟元素
```

> #### 指令值说明

1. v-varify:groupname.input.change.
2. arg: 组名
3. modifiers: 响应事件，值：input,change,blur, 默认：input+blur
4. value: 包含n个对象的数组
```
 {
     test: <regexp|funtion>,[<regexp|funtion>]、或者是值为正则或方法的数组，test值为function时，如果返回Boolean true为验证通过，为
           false，错误提示用当前对象下的tip。如果是数组，只要其中一个验证通过，则该test验证通过。            
           如果返回的是string，则会作为错误提示显示
     tip:  <string> 提示语,
     effect: <string>同上，优先级高于标签属性
     effectClass：<string> 同上，优先级高于标签属性
 }  
```

#### #提交前验证
```
methods:{
    submit(){
        this.$varify(groupname,ref)
            .then((type)=>{
                // type == empty ? "无groupname的分组"： "有，且他通过"
                // 验证通过
            })
            .catch(res=>{
                console.log(res)
            })
    }
}
```
> #### 说明

1. this.$varify 扩展的varify方法,返回promise,catch下会包含一些信息
2. groupname: <String>,[必须]，组名，注意：如果未找到对应的分组信息，会返回true
3. ref, <Object> || <Array>,[可选],vue的ref对象值，如上：this.$ref.password。该项存在时，则$varify 验证只该项，该组下其他成员不过进行验证



<hr>

《别来无恙》
       ---  陈伯宇
   
