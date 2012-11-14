var fs = require('fs')
    , path = require('path')
    ;

// Cloudwatch, IAM, and other up-to-date AWS tools do it this way
function fromCredentialFile(callback) {
  if (!process.env.AWS_CREDENTIAL_FILE) return callback("AWS_CREDENTIAL_FILE not in ENV");

  var aws_path = path.resolve(process.env.AWS_CREDENTIAL_FILE.replace("~", process.env.HOME));
  fs.readFile(aws_path, "utf8", function(err, aws_creds) {
    if (err) callback(err);

    callback(null, {
      key: aws_creds.match(/^AWSAccessKeyId\s*=\s*(\S+)$/mi)[1]
      , secret: aws_creds.match(/^AWSSecretKey\s*=\s*(\S+)$/mi)[1]
    });
  });
}

// s3cmd style
function fromS3Style(callback) {
  var s3cfg_path = path.join(process.env.HOME, ".s3cfg");
  fs.readFile(s3cfg_path, "utf8", function(err, s3cfg) {
    if (err) return callback(err);

    callback(null, {
      key: s3cfg.match(/^access_key\s*=\s*(\S+)$/mi)[1]
      , secret: s3cfg.match(/^secret_key\s*=\s*(\S+)$/mi)[1]
    });
  });
}

// environment style
function fromEnv(callback) {
  var creds = { 
    key: process.env.AWS_ACCESS_KEY_ID
    ,secret: process.env.AWS_SECRET_ACCESS_KEY
  };

  if (creds.key && creds.secret) {
    return callback(null, creds);
  }

  if (!creds.key && !creds.secret) {
    callback("Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in ENV");
  } else if (!creds.key ) {
    callback("Missing AWS_ACCESS_KEY_ID in ENV");
  } else if (!creds.secret) {
    callback("Missing AWS_SECRET_ACCESS_KEY in ENV");
  } else {
    callback("oops");
  }
}

function getCredentials(callback) {
  var queue = [fromCredentialFile, fromS3Style, fromEnv];

  function go() {
    var func = queue.shift();
    if (!func) return callback("No credentials found.");

    function cb(err, creds) {
      if (err) return process.nextTick(go);

      callback(null, creds);
    }
    func(cb);
  };
  go();
}

module.exports = getCredentials;

getCredentials.knox = function(bucket, callback) {
  var knox = require('knox');
  getCredentials(function(err, creds) {
    if (err) return callback(err);

    creds.bucket = bucket;
    callback(null, knox.createClient(creds));
  });
}

if (!module.parent) {
  getCredentials(function(err, creds){
    console.log(err || creds);
  })

  // getCredentials.knox("mybucket", function(err, creds){
  //   console.log(err || creds);
  // })
}
