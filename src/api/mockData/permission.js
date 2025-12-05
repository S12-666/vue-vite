import Mock from 'mockjs';
export default {
    getMenu: config => {
        const { username, password } = JSON.parse(config.body)
        // 先判断用户是否存在
        // 判断账号和密码是否对应
        //menuList用于后面做权限分配，也就是用户可以展示的菜单
        if (username === 'superadmin' && password === 'woshimima') {
            return {
                code: 200,
                data: {
                    menuList: [
                        {
                            path: '/visual',
                            name: 'visual',
                            label: '可视分析',
                            icon: 'analysis',
                            url: 'Visual'
                        },
                        {
                            path: '/limits',
                            name: 'limits',
                            label: '权限管理',
                            icon: 'limits',
                            url: 'Limits'
                        },
                        {
                            path: '/user',
                            name: 'user',
                            label: '用户管理',
                            icon: 'user',
                            url: 'User'
                        },
                        {
                            path: 'dataoverview',
                            label: '关键指标',
                            icon: 'dataoverview',
                            children: [
                                {
                                    path: '/heating',
                                    name: 'heating',
                                    label: '加热工序',
                                    icon: 'heating',
                                    url: 'Heating'
                                },
                                {
                                    path: '/rolling',
                                    name: 'rolling',
                                    label: '轧制工序',
                                    icon: 'rolling',
                                    url: 'Rolling'
                                },
                                {
                                    path: '/cooling',
                                    name: 'cooling',
                                    label: '冷却工序',
                                    icon: 'cooling',
                                    url: 'Cooling'
                                }
                            ]
                        }
                    ],
                    token: Mock.Random.guid(),
                    message: '获取成功'
                }
            }
        } else if (username === 'admin' && password === 'woshimima') {
            return {
                code: 200,
                data: {
                    menuList: [
                        {
                            path: '/visual',
                            name: 'visual',
                            label: '可视分析',
                            icon: 'analysis',
                            url: 'Visual'
                        },
                        {
                            path: 'dataoverview',
                            label: '关键指标',
                            icon: 'dataoverview',
                            children: [
                                {
                                    path: '/heating',
                                    name: 'heating',
                                    label: '加热工序',
                                    icon: 'heating',
                                    url: 'Heating'
                                },
                                {
                                    path: '/rolling',
                                    name: 'rolling',
                                    label: '轧制工序',
                                    icon: 'rolling',
                                    url: 'Rolling'
                                },
                                {
                                    path: '/cooling',
                                    name: 'cooling',
                                    label: '冷却工序',
                                    icon: 'cooling',
                                    url: 'Cooling'
                                }
                            ]
                        }
                    ],
                    token: Mock.Random.guid(),
                    message: '获取成功'
                }
            }
        } else {

            return {
                code: -999,
                data: {
                    message: '密码错误'
                }
            }

        }

    }
}