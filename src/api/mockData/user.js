import Mock from 'mockjs'

// 1. 数据生成逻辑 (保持不变)
let List = []
const count = 200

for (let i = 0; i < count; i++) {
    List.push(
        Mock.mock({
            id: Mock.Random.guid(),
            name: Mock.Random.cname(),
            addr: Mock.mock('@county(true)'),
            'age|18-60': 1,
            birth: Mock.Random.date(),
            sex: Mock.Random.integer(0, 1)
        })
    )
}

// 2. 导出 mock 规则数组 (vite-plugin-mock 要求的格式)
export default [
    // --- 获取列表 ---
    {
        url: '/api/home/getUserData', // 对应你前端 api/user.js 里的 URL
        method: 'get',
        response: (config) => {
            // 插件已经帮你把 url 参数解析在 config.query 里了，不需要 param2Obj 了
            const { name, page = 1, limit = 10 } = config.query

            const mockList = List.filter(user => {
                if (name && user.name.indexOf(name) === -1) return false
                return true
            })

            const pageList = mockList.filter((item, index) => index < limit * page && index >= limit * (page - 1))

            return {
                code: 200,
                data: {
                    list: pageList,
                    count: mockList.length,
                }
            }
        }
    },

    // --- 删除用户 ---
    {
        url: '/api/user/deleteUser',
        method: 'get',
        response: (config) => {
            const { id } = config.query // 获取 GET 参数

            if (!id) {
                return {
                    code: -999,
                    message: '参数不正确'
                }
            } else {
                List = List.filter(u => u.id !== id)
                return {
                    code: 200,
                    message: '删除成功'
                }
            }
        }
    },

    // --- 增加用户 ---
    {
        url: '/api/user/addUser',
        method: 'post',
        response: (config) => {
            // config.body 通常已经是对象了，但为了保险起见，做个兼容
            const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
            const { name, addr, age, birth, sex } = body

            List.unshift({
                id: Mock.Random.guid(),
                name: name,
                addr: addr,
                age: age,
                birth: birth,
                sex: sex
            })

            return {
                code: 200,
                data: {
                    message: '添加成功'
                }
            }
        }
    },

    // --- 修改用户 ---
    {
        url: '/api/user/editUser',
        method: 'post',
        response: (config) => {
            const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body
            const { id, name, addr, age, birth, sex } = body
            const sex_num = parseInt(sex)

            List.some(u => {
                if (u.id === id) {
                    u.name = name
                    u.addr = addr
                    u.age = age
                    u.birth = birth
                    u.sex = sex_num
                    return true
                }
            })

            return {
                code: 200,
                data: {
                    message: '编辑成功'
                }
            }
        }
    }
]