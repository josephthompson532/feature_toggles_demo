import {
    AppConfigDataClient,
    BadRequestException,
    GetLatestConfigurationCommand,
    StartConfigurationSessionCommand,
} from "@aws-sdk/client-appconfigdata";

var client = new AppConfigDataClient();
let existingToken;

var params = {
    ApplicationIdentifier: '80op321', /* required */
    ConfigurationProfileIdentifier: 'TrinSearchFlags', /* required */
    EnvironmentIdentifier: 'DEV' /* required */
}

const getToken = async() => {
    const getSession = new StartConfigurationSessionCommand(params)
    const sessionToken = await client.send(getSession);
    return sessionToken.InitialConfigurationToken || "";
}

const featureFlag = async(flag) => {
    if (!existingToken) {
        existingToken = await getToken();
        // console.log(existingToken)
    }
    try {
        const command = new GetLatestConfigurationCommand({
            ConfigurationToken: existingToken
        })
        const response = await client.send(command)

        let flags;
        if (response.Configuration) {
            let str = "";
            
            for (let i = 0; i < response.Configuration.length; i++) {
              str += String.fromCharCode(response.Configuration[i]);
            }
            const allFlag = JSON.parse(str);
            // console.log(allFlag);
            flags = Object.assign({}, allFlag);
        }
        return Boolean(flags[flag].enabled)
    } catch (err) {
        if (err instanceof BadRequestException) {
            existingToken = await getToken()
            console.log(existingToken)
            return featureFlag(flag)
        } else {
            throw err
        }
    }
}

export default featureFlag


