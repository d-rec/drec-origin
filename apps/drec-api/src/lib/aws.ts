import * as AWS from 'aws-sdk';

interface SmsParams {
  phoneNumber: string;
  message: string;
}

export const sendSms = async ({
  phoneNumber,
  message,
}: SmsParams): Promise<void> => {
  const sns = new AWS.SNS({
    region: process.env.region,
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  });

  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'DREC',
      },
    },
  };

  try {
    await sns.publish(params).promise();
  } catch (error) {
    console.error('Error sending SMS via SNS:', error);
    throw new Error('Failed to send OTP via SMS');
  }
};
