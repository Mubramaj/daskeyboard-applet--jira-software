const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://jira.com/api/';

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

    logger.info("Initialisation.")

    // Get conversations
    // https://api.jira.com/methods/conversations.list

  }

  async getMessages() {
    // Get messages from the conversations (check email)
    // https://api.jira.com/methods/conversations.history

    // Need to update. Was for testing.
    // const query = "search.messages?query=pickleface&sort=timestamp&pretty=1";
    const query = "search.messages?query=pickleface&sort=timestamp";

    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });

    // first get the user projects
    return this.oauth2ProxyRequest(proxyRequest);
  }

  async run() {
    console.log("Running.");
    return this.getMessages().then(newMessages => {
      this.timestamp = getTimestamp();
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