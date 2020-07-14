// URL of the RSS feed to parse
var RSS_FEED_URL = "http://feeds.feedburner.com/GoogleAppsUpdates?format=xml";

// Webhook URL of the Hangouts Chat room
var WEBHOOK_URL = "<YOUR WEBHOOK URL>";

// When DEBUG is set to true, the topic is not actually posted to the room
var DEBUG = false;

// This function is wired up to a trigger to monitor for new blog posts
function fetchNews() {
  
  //An Apps Script project property called lastUpdate is used to avoid an . 
  var lastUpdate = new Date(parseFloat(PropertiesService.getScriptProperties().getProperty("lastUpdate")) || 0);

  Logger.log("Last update: " + lastUpdate);
  
  Logger.log("Fetching '" + RSS_FEED_URL + "'...");
  
  var xml = UrlFetchApp.fetch(RSS_FEED_URL).getContentText();
  var document = XmlService.parse(xml);
   
  var root = document.getRootElement();
  var atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  var feedburnerNS = XmlService.getNamespace('http://rssnamespace.org/feedburner/ext/1.0');
  var items= root.getChildren('entry', atom).reverse();

  var count = 0;
  
  for (var i = 0; i < items.length; i++) {
    var pubDate = new Date(items[i].getChild('published', atom).getText());

    var title = items[i].getChild("title", atom).getText();

    var link = items[i].getChildText('origLink', feedburnerNS);
    var description = 'New update from the G Suite blog.';
    
    if(DEBUG){
      Logger.log("------ " + (i+1) + "/" + items.length + " ------");
     // Logger.log(pubDate);
      Logger.log(title);
      Logger.log(link);
      // Logger.log(description);
      Logger.log("--------------------");
    }
    if(pubDate.getTime() > lastUpdate.getTime()) {
      Logger.log("Posting topic '"+ title +"'...");
      Logger.log('pubdate was '+ pubDate + ' and last update is '+ lastUpdate);
      if(!DEBUG){
        postTopic_(title, description, link);
      }
     // PropertiesService.getScriptProperties().setProperty("lastUpdate", pubDate.getTime());
     //The Apps Script property lastUpdate is updated to the latest set time, so that the next time this script runs it will ignore all of the older ones
     PropertiesService.getScriptProperties().setProperty("lastUpdate", pubDate.getTime());
      Logger.log('updated pub date');
      count++;
    }
  }
  
  Logger.log("> " + count + " new(s) posted");
}

//This function posts to the target webhook
function postTopic_(title, description, link) {
  
  var text = "*" + title + "*" + "\n";
  
  if (description){
    text += description + "\n";
  }
  
  text += link;
  
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify({
      "text": text 
    })
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}
