/**
 * Created by Bey.BLQ on 2017/11
 */
let validator = {
    version: 1.0,
    group: {},
    setTips(el, txt, oldEffectActive, {effect, effectClass}) {
        let oldEffectNode = this.getNode(el, oldEffectActive.effect)
        oldEffectNode && oldEffectNode.classList.remove(oldEffectActive.effectClass)
        effectClass && this.getNode(el, effect).classList.add(effectClass)
        el.nextElementSibling && ( el.nextElementSibling.innerHTML = txt)
    },
    getNode(el, effect) {
        if (/^(parent)+(.\d)?$/.test(effect)) {
            for (let i = 0; i < Number(effect.split(".")[1] || 1); i++) {
                if (!el.parentNode) break
                el = el.parentNode
            }
        }
        return el
    },
    identykey(el) {
        return Object.keys(el.dataset).filter((item) => {
            return item.startsWith('vik') || item.startsWith('vik-')
        })[0].replace(/^(vik(-?))/, '').toLowerCase()
    },
    creatIdentyKey() {
        let i = 0
        let random = ""
        while (i < 8) {
            i++
            random += Math.round(Math.random() * 16).toString(16)
        }
        return random.toLowerCase()
    },
    vnodeChange(vnode, oldVnode) {
        return (vnode.data.model.value || vnode.elm.value ) === (oldVnode.data.model.value || oldVnode.elm.value)
    },
    varify({obj, obj: {effectActive, params: {required, equal, modifiers, rules, defaultTip, effect, effectClass}}}, type, callback = function () {
    }) {
        const value = obj.value
        let tip = '', matchType = '', nextEffectActive = {effect, effectClass}
        if (required && (obj.value == '' || obj.value.length < 1)) {
            tip = defaultTip[0]
            matchType = "required"
        } else if (equal && !obj.valueIsEqual) {
            matchType = "equal"
            tip = required ? tip[1] : tip[0] || ''
        } else {
            for (let item of rules) {
                nextEffectActive = {
                    effect: item.effect || effect,
                    effectClass: item.effectClass || effectClass
                }

                if (typeof item.test === "function") {
                    let res = item.test(value)
                    if (!(typeof res === "boolean" && res)) {
                        matchType = "function"
                        tip = typeof res === "string" ? res : item.tip || ''
                        break;
                    }
                } else if (Array.isArray(item.test)) {
                    let pass = false
                    for (let child of item.test) {
                        if (child.test(value)) {
                            pass = true
                            break;
                        }
                    }
                    if (!pass) {
                        matchType = "regexp"
                        tip = item.tip || ''
                        break;
                    }
                } else if (!(item.test && item.test.test(value))) {
                    matchType = "regexp"
                    tip = item.tip || ''
                    break;
                }
            }
        }

        if ((type == 'vnode' && (modifiers['input'] || equal)) || type == "event" || type == "submit") {
            if (matchType == "") {
                validator.setTips(obj.el, '', effectActive, {})
            } else {
                validator.setTips(obj.el, tip, effectActive, nextEffectActive)
            }
        }

        obj.effectActive = nextEffectActive
        callback(matchType == "" ? null : {
            el: obj.el,
            message: tip,
            value: value,
            matchType: matchType,
            effectActive
        })
    }
}

validator.install = function (Vue) {
    let self = this
    Vue.directive("varify", {
        bind(el, {modifiers, arg: groupName = "default", value: rules = []}, vnode) {
            const attr = vnode.data.attrs || {}
            const identykey = self.creatIdentyKey()
            el.setAttribute("data-vik-" + identykey, '')

            let group = validator.group[groupName]
            if (!group) group = validator.group[groupName] = new Object()

            group[identykey] = new creatVarifyObj(el, vnode, {
                rules,
                modifiers,
                groupName,
                equal: attr.equal != undefined,
                effect: attr.effect || 'self',
                required: "required" in attr ? true : false,
                defaultTip: attr.tip ? attr.tip.split("|") : [],
                effectClass: attr.effectClass || 'varifyform-effect'
            })

            function beforeVarify() {
                self.varify({obj: group[identykey]}, "event")
            }

            if (!(Object.keys(modifiers).length > 0)) {
                modifiers.blur = true
                modifiers.input = true
            }
            if (modifiers.input) {
                el.addEventListener("input", beforeVarify, true)
            }
            if (modifiers.change) {
                el.addEventListener("change", beforeVarify, true)
            }
            if (modifiers.blur) {
                el.addEventListener("blur", beforeVarify, true)
            }
        },
        update(el, binding, vnode, oldVnode) {
            let group = self.group
            const index = self.identykey(el)
            const groupname = binding.arg || "default"
            if (index && group[groupname] && group[groupname][index]) {
                group[groupname][index].vnode = vnode
                if ((vnode.data.model && vnode.data.model.value != '') && vnode.data.model && validator.vnodeChange(vnode, oldVnode)) {
                    self.varify({obj: group[groupname][index]}, 'vnode')
                }
            }
        },
        unbind(el, {arg}) {
            delete validator.group[arg || 'default'][self.identykey(el)]
        }
    })

    Vue.prototype.$varify = function (groupName = 'default', elmAry = []) {
        let objAry = []
        let resultList = []
        let groups = self.group

        return new Promise((resolve, reject) => {
            if (groups.hasOwnProperty(groupName)) {
                elmAry = Array.isArray(elmAry) ? elmAry : [elmAry]
                if (elmAry.length > 0) {
                    elmAry.forEach(item => {
                        objAry.push(groups[groupName][self.identykey(item).toLowerCase()])
                    })
                } else {
                    objAry = groups[groupName]
                }

                for (let item in objAry) {
                    self.varify({obj: objAry[item]}, 'submit', function (res) {
                        if (res) resultList.push(res)
                    })
                }

                if (resultList.length > 0) {
                    reject({type: "error", groupName: groupName, children: resultList})
                } else {
                    resolve(objAry.length > 0 ? "" : "empty")
                }
            } else {
                reject({
                    type: "none",
                    groupName: groupName,
                    message: `未检测到组名为${groupName}的分组`
                })
            }
        })
    }
}

function creatVarifyObj(el, vnode, params) {
    this.el = el
    this.vnode = vnode
    this.params = params
    this.effectActive = {}

    Object.defineProperties(this, {
        value: {
            get() {
                let elm = this.el
                return elm.nodeName == "input" && elm.type == "file" ? elm.files : elm.value != undefined ? elm.value : this.vnode.data.model.value
            }
        },
        valueIsEqual: {
            get() {
                return this.el.getAttribute("equal") === this.value
            }
        }
    })
}

export default validator
