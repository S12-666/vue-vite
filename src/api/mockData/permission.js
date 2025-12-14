import Mock from 'mockjs';

export default [
    {
        url: '/api/permission/getMenu', // 对应前端 api 里的请求地址
        method: 'post',
        response: (config) => {
            // 兼容处理：vite-plugin-mock 有时会自动解析 body 为对象，有时是字符串
            const body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
            const { username, password } = body;

            // --- 逻辑开始 ---

            // 1. 超级管理员 superadmin
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
                                url: 'visual/Visual'
                            },
                            {
                                path: '/limits',
                                name: 'limits',
                                label: '权限管理',
                                icon: 'limits',
                                url: 'limits/Limits'
                            },
                            {
                                path: '/user',
                                name: 'user',
                                label: '用户管理',
                                icon: 'user',
                                url: 'user/User'
                            },
                            {
                                path: '/report',
                                name: 'report',
                                label: '报表管理',
                                icon: 'report',
                                url: 'report/Report'
                            },
                            {
                                path: 'dataoverview',
                                label: '数据概览',
                                icon: 'dataoverview',
                                children: [
                                    {
                                        path: '/specification',
                                        name: 'specification',
                                        label: '规格参数',
                                        icon: 'spec',
                                        url: 'dataoverview/specification/Specification'
                                    },
                                    {
                                        path: '/heating',
                                        name: 'heating',
                                        label: '加热工序',
                                        icon: 'heating',
                                        url: 'dataoverview/heating/Heating'
                                    },
                                    {
                                        path: '/rolling',
                                        name: 'rolling',
                                        label: '轧制工序',
                                        icon: 'rolling',
                                        url: 'dataoverview/rolling/Rolling'
                                    },
                                    {
                                        path: '/cooling',
                                        name: 'cooling',
                                        label: '冷却工序',
                                        icon: 'cooling',
                                        url: 'dataoverview/cooling/Cooling'
                                    }
                                ]
                            }
                        ],
                        token: Mock.Random.guid(),
                        message: '获取成功'
                    }
                };
            }
            // 2. 普通管理员 admin
            else if (username === 'admin' && password === 'woshimima') {
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
                };
            }
            // 3. 密码或账号错误
            else {
                return {
                    code: -999,
                    data: {
                        message: '密码错误'
                    }
                };
            }
        }
    }
];