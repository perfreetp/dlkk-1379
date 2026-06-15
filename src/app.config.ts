export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/goals/index',
    'pages/schedule/index',
    'pages/statistics/index',
    'pages/mine/index',
    'pages/goal-detail/index',
    'pages/goal-create/index',
    'pages/task-assign/index',
    'pages/review/index',
    'pages/expense-record/index',
    'pages/reminder-center/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF7A59',
    navigationBarTitleText: '家庭目标',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F5'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF7A59',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/goals/index',
        text: '目标'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '日程'
      },
      {
        pagePath: 'pages/statistics/index',
        text: '统计'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
