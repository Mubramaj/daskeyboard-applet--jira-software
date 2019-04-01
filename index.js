const q = require('daskeyboard-applet');
const request = require('request-promise');

const logger = q.logger;
const queryUrlBase = 'https://api.atlassian.com';

function getTimestamp() {
  var d = new Date(Date.now()),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

class Jira extends q.DesktopApp {
  constructor() {
    super();
    // run every min
    this.pollingInterval = 1 * 60 * 1000;

    this.timestamp = getTimestamp();
    // For checking plural or singular
    this.notification = "";
  }

  async applyConfig() {
    logger.info("=================");

    logger.info("Initialisation.");

    const query = "/oauth/token/accessible-resources";

    // V1

    // this.serviceHeaders = {
    //   "Accept": "application/json",
    //   "Authentication": `Bearer ${this.authorization.apiKey}`,
    // }

    // return request.get({
    //   url: queryUrlBase + query,
    //   headers: this.serviceHeaders,
    //   json: true
    // }).then((body) => {

    //   logger.info("This is the config: ", body);
    //   logger.info("This is the stringify config: ", JSON.stringify(body));

    //   return null;

    // })
    //   .catch(error => {
    //     logger.error(
    //       `Got error sending request to service: ${JSON.stringify(error)}`);
    //     return q.Signal.error([
    //       'The ZenHub service returned an error. Please check your API key and account.',
    //       `Detail: ${error.message}`]);
    // });

    // V2

    // // Get the cloudid for your site
    // const proxyRequest = new q.Oauth2ProxyRequest({
    //   apiKey: this.authorization.apiKey,
    //   uri: queryUrlBase + query,
    //   method: 'GET',

    // });

    // // return this.oauth2ProxyRequest(proxyRequest);

    // return this.oauth2ProxyRequest(proxyRequest).then(config => {
    //   logger.info("This is the config: ", config);
    //   logger.info("This is the stringify config: ", JSON.stringify(config));

    //   return null;
    // });

    // V3

    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey
    });

    return Promise.all(proxyRequest.getOauth2ProxyToken()).then((token)=>{
      logger.info("This is the token!!!!!!!!! ", token)
    })

  }

  async getNotifications() {
    // Get messages from the conversations (check email)
    // https://api.jira.com/methods/conversations.history

    // Need to update. Was for testing.
    // const query = "search.messages?query=pickleface&sort=timestamp&pretty=1";
    const query = "search.messages?query=pickleface&sort=timestamp";

    // const proxyRequest = new q.Oauth2ProxyRequest({
    //   apiKey: this.authorization.apiKey
    // });

    // return proxyRequest.getOauth2ProxyToken().then(token => {
    //   console.log('TOOOKKEENN', token);
    // }).catch(err => {
    //   // TODO handle error
    // })
    

    // first get the user projects
    // return this.oauth2ProxyRequest(proxyRequest);

    return null;
  }

  async run() {
    console.log("Running.");
    return this.getNotifications().then(newMessages => {
      // this.timestamp = getTimestamp();
      logger.info("This is the response", newMessages);
      if (newMessages && newMessages.length > 0) {

        if (newMessages.length == 1) {
          this.notification = "notification";
        } else {
          this.notification = "notifications";
        }

        logger.info("Got " + newMessages.length + this.notification);


        return new q.Signal({
          points: [
            [new q.Point("#0000FF", q.Effects.BLINK)]
          ],
          name: `Jira`,
          message: `You have a new notification.`,
          link: {
            url: 'https://jira.com',
            label: 'Show in Jira',
          },
        });
      } else {
        return null;
      }
    }).catch(error => {
      const message = error.statusCode == 402
        ? 'Payment required. This applet requires a premium Jira account.' : error;
      logger.error(`Sending error signal: ${message}`);
      throw new Error(message);
    })
  }
}


module.exports = {
  Jira: Jira
}

const applet = new Jira();