const Nightmare = require('nightmare')
co = require('co')
const { csvFormat } = require('d3-dsv');
const { readFileSync, writeFileSync, appendFileSync } = require('fs');
var nightmare;
var dataSet = new Set();
var dataArray = [];
var pageData = []
var pageNum=1;
var filename = 'final.csv'

// setup
co(function*() {
    try{
        yield newNightmare();

        yield nightmare
            .goto('http://noraproperty.nola.gov/Default.aspx')
            .click('#form1 > div.page-container > div:nth-child(3) > div.row.header > div:nth-child(1) > div > div > div > div > ul > li:nth-child(1) > a')
            .select('#MainContent_ctl00_ddPage', '200')
            .wait(5000)
        
        var data = yield gatherData()
        console.log(data)
        appendDataSet(data)
        appendDataArray(data)
        appendPageData(data)
        yield nightmare.wait(5000)
        

        while(yield nextPage()){
            yield nightmare.wait(5000)
            var data = yield gatherData()
            appendDataSet(data)
            appendDataArray(data)
            appendPageData(data)
            console.log(data)  
        }

        yield nightmare.wait(5000)
        yield endNightmare()

        saveToFileSync(filename, dataSet)
        console.log("Size of dataSet:" + dataSet.size)
        console.log("Size of dataArray:" + dataArray.length)
        console.log("PageInfo:" + JSON.stringify(pageData, null, 4))

    } catch(e) {
        console.error(e);
        throw e
    }
})

function appendPageData(in_data){
    pageData[pageNum] = { "first": in_data[0], "count": in_data.length}
    pageNum = pageNum + 1
}

function appendDataSet(in_data){
    in_data.forEach(function(element) {
        dataSet.add(element)
    });
}

function appendDataArray(in_data){
    dataArray = dataArray.concat(in_data);
}

function nextPage() {
    return co(function*() {
        try{
            var selector = '.pagination > ul > li.active + li > a'
            var hasHref = yield nightmare.wait('.pagination').evaluate((selector)=>{
                            return document.querySelector(selector).hasAttribute('href')
                        }, selector)

            if(hasHref){
                console.log("Next Page")
                yield nightmare.click(selector)
            }
            console.log(hasHref);
            return hasHref
        } catch (e) {
            console.error("Failed in nextPage: " + e.stack);
            throw e;
        }
    });
}

function gatherData () {
    return co(function*(){
        try{
            console.log("Gathering Data")
            return yield nightmare.evaluate(() => {
                return [...document.querySelectorAll('#results-grid div.results-title h3')]
                        .map(el => el.innerHTML.split('<span')[0] + " " + "New Orleans LA");
            })
        }
        catch(e) {
            console.error(e);
            throw e
        }
    });
}

function newNightmare() {
    return co(function*() {
  
      yield endNightmare();
  
      nightmare = Nightmare({
        executionTimeout: 20000,
        waitTimeout: 20000,
        openDevTools: {
          mode: 'detach'
        },
        show: true
      });
    });
  }

function endNightmare() {
  return co(function*() {
    if (nightmare != null) {
      yield nightmare.end();
      nightmare = null;
    }
  });
}

function setup(){
    return co(function*(){
        yield nightmare
            .goto('http://noraproperty.nola.gov/Default.aspx')
            .click('#form1 > div.page-container > div:nth-child(3) > div.row.header > div:nth-child(1) > div > div > div > div > ul > li:nth-child(1) > a')
            .select('#MainContent_ctl00_ddPage', '200')
    })
}

function saveToFileSync(filename, data) {
    console.log("Storing in file");
    try {
      data = [...data].join("\n")
      writeFileSync('./' + filename, data);
    } catch (error) {
      console.log('Failed storing data in file.')
      throw error;
    }
  }
