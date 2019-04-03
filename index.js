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

async function processProjectsResponse(response) {
  logger.info(`Processing Jira Software repos response`);
  const options = [];
  response.forEach(project => {
    options.push({
      key: project.id.toString(),
      value: project.name.toString()
    });
  });
  logger.info(`got ${options.length} options`);
  options.forEach(o => logger.info(`${o.key}: ${o.value}`));
  return options;


}

class JiraSoftware extends q.DesktopApp {
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

    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query,
      method: 'GET',
    });

    return this.oauth2ProxyRequest(proxyRequest).then(config => {
      logger.info("This is the config: "+ config);
      logger.info("This is the stringify config: "+ JSON.stringify(config));
      // Get account properties for requests
      this.cloudId = config[0].id;
      this.myDomain = config[0].name;
      this.myAvatarUrl = config[0].avatarUrl;
      logger.info("This is the cloudID: "+ this.cloudId);
      logger.info("This is the myDomain: "+ this.myDomain);
      logger.info("This is the myAvatarUrl: "+ this.myAvatarUrl);

      // Get initial number of notifications
      const proxyRequestNotifications = new q.Oauth2ProxyRequest({
        uri: `https://compagny.atlassian.net/gateway/api/notification-log/api/2/notifications?cloudId=${this.cloudId}&direct=true&includeContent=true`,
        json: true
      });

      return request.get(proxyRequestNotifications).then(notifications => {

        logger.info("This is notifications data: "+notifications);

        for (let notification of notifications){
          logger.info("This is notification only: "+notification);
        }

        return null;

      });
    });

  }

  /**
  * Loads the list of projects
  */
  async  loadProjects() {
    logger.info(`Loading projects`);
    const query = "/oauth/token/accessible-resources";

    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/project`,
      method: 'GET',
    });

    return this.oauth2ProxyRequest(proxyRequest);
  }

  /**
  * Called from the Das Keyboard Q software to retrieve the options to display for
  * the user inputs
  * @param {} fieldId 
  * @param {*} search 
  */
  async options(fieldId, search) {
    return this.loadProjects().then(body => {
      logger.info("This is your projects"+JSON.stringify(body));
      return processProjectsResponse(body);
    }).catch(error => {
      logger.error(`Caught error when loading options: ${error}`);
    });
  }

  async getAllProjects() {
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
    logger.info("Running.");
    const projectId = this.config.projectId;
    logger.info("This is the project Id: "+projectId);

    return this.getAllProjects().then(allProjects => {
      // this.timestamp = getTimestamp();
      // logger.info("This is nothing: " + JSON.stringify(allProjects));
      //if (newMessages && newMessages.length > 0) {
      if (false){

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
          name: `Jira Software`,
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
  JiraSoftware: JiraSoftware,
  processProjectsResponse: processProjectsResponse
}

const applet = new JiraSoftware();