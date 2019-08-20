/*  爬虫整个流程  */
/* 1.使用express搭建一个服务器 */
/* 2.使用superagent访问目标网站获取到目标网站的HTML代码 */
/* 3.使用cheerio去查找到HTML代码中所需要的数据*/
/* 4.把数据返回给服务器，然后展示出来 */
/* 5.爬取本地新闻的时候，本地新闻是在加载完页面后通过ajax获取的，所以使用下载HTML静态文件的方式获取不到 */
/* 6.使用nightmare在爬取数据的时候，模拟访问服务器获取数据 */
/* 7.然后在把获取到的数据使用cheerio去查找到HTML代码中所需要的数据 */

//引入框架
const express = require('express');

//实例化对象
const app = express();

// 引入所需要的第三方包
const superagent= require('superagent');
// 引入所需要的第三方包
const cheerio = require('cheerio');

const Nightmare = require('nightmare');          // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true });     // show:true  显示内置模拟浏览器


let hotNews = [];                                // 热点新闻
let localNews = [];                              // 本地新闻


app.get("/",(req,res) =>{
	
	res.send({
		hotNews:hotNews,
		localNews:localNews
	});
	
})

/**
 * index.js
 * [description] - 使用superagent.get()方法来访问百度新闻首页
 */
superagent.get('http://news.baidu.com/').end((err, res) => {
  if (err) {
    console.log(`热点新闻抓取失败 - ${err}`)
  } else {
   // 抓取热点新闻数据
   hotNews = getHotNews(res)
  }
});

//监听端口
let server = app.listen(8080, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log('Your App is running at http://%s:%s', host, port);
});

/**
 * [description] - 抓取本地新闻页面
 * [nremark] - 百度本地新闻在访问页面后加载js定位IP位置后获取对应新闻，
 * 所以抓取本地新闻需要使用 nightmare 一类的自动化测试工具，
 * 模拟浏览器环境访问页面，使js运行，生成动态页面再抓取
 */
// 抓取本地新闻页面
nightmare
.goto('http://news.baidu.com/')
.wait("div#local_news")
.evaluate(() => document.querySelector("div#local_news").innerHTML)
.then(htmlStr => {
  // 获取本地新闻数据
  localNews = getLocalNews(htmlStr)
})
.catch(error => {
  console.log(`本地新闻抓取失败 - ${error}`);
})


/**
 * - 抓取热点新闻页面
 */
let getHotNews = (res) => {
  let hotNews = [];
  // 访问成功，请求http://news.baidu.com/页面所返回的数据会包含在res.text中。
  /* 使用cheerio模块的cherrio.load()方法，将HTMLdocument作为参数传入函数
     以后就可以使用类似jQuery的$(selectior)的方式来获取页面元素
   */
  let $ = cheerio.load(res.text);

  // 找到目标数据所在的页面元素，获取数据
  $('div#pane-news ul li a').each((idx, ele) => {
    // cherrio中$('selector').each()用来遍历所有匹配到的DOM元素
    // 参数idx是当前遍历的元素的索引，ele就是当前便利的DOM元素
    let news = {
      title: $(ele).text(),        // 获取新闻标题
      href: $(ele).attr('href')    // 获取新闻网页链接
    };
    hotNews.push(news)              // 存入最终结果数组
  });
  return hotNews
};
/**
 * - 抓取本地新闻页面
 */
let getLocalNews = (htmlStr) => {
  let localNews = [];
  let $ = cheerio.load(htmlStr);
    
  // 本地新闻
  $('ul#localnews-focus li a').each((idx, ele) => {
    let news = {
      title: $(ele).text(),
      href: $(ele).attr('href'),
    };
    localNews.push(news)
  });
    
  // 本地资讯
  $('div#localnews-zixun ul li a').each((index, item) => {
    let news = {
      title: $(item).text(),
      href: $(item).attr('href')
    };
    localNews.push(news);
  });

  return localNews
};


