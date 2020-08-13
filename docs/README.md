This folder contains the website for Well Ping.

## Universal Links (for the `app/` folder)

If the user has installed the app, they will be able to launch the app by visiting any page under https://stanfordsocialneurosciencelab.github.io/WellPing/app/ (the `app/` folder). This is very useful for pre-filling the login information, as the user simply has to click a link in the email they received to automatically have the app opened and their user login code entered.

This is set up on the web-side by https://github.com/StanfordSocialNeuroscienceLab/stanfordsocialneurosciencelab.github.io/blob/master/.well-known/apple-app-site-association and https://github.com/StanfordSocialNeuroscienceLab/stanfordsocialneurosciencelab.github.io/blob/master/.well-known/assetlinks.json and on the client-side by `ios.associatedDomains` and `android.intentFilters` keys in https://github.com/StanfordSocialNeuroscienceLab/WellPing/blob/master/app.json.

See https://docs.expo.io/workflow/linking/#universaldeep-links-without-a-custom-scheme for more information.
