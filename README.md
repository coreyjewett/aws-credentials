aws-credentials
===============

Load AWS credential data from ENV/filesystem by cascading through several styles.

    var awscreds = require('aws-credentials');
    awscreds('mybucket', function(err, creds) {
      // prime knox
      knox.createClient(creds)
    })

Specifically:
 * Looks for $AWS_CREDENTIAL_FILE
 * Looks for ~/.s3cmd
 * Looks for $AWS_ACCESS_KEY_ID/$AWS_SECRET_ACCESS_KEY


Knox
----
Want to cut a couple more lines of code out of your life? Try the knox shortcut.

    awscreds.knox("mybucket", function(err, client){
      console.log(err || client);
    });

You need the knox module installed for this to work.