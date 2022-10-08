import { SQSEvent, SQSHandler, SQSRecord } from '../types'
import { deleteContentFromS3, fetchContentFromS3 } from '../services/s3'
import { generateEmailFromData, sendErrorEmail, sendRawEmail } from '../services/ses'
import { log, logError } from '../utils/logging'
import { getDataFromRecord } from '../utils/message-processing'

/* Queue processing */

export const processSingleMessage = async (record: SQSRecord): Promise<void> => {
  const data = getDataFromRecord(record)
  const contents = await fetchContentFromS3(data.uuid)
  const email = await generateEmailFromData(contents)
  await sendRawEmail(email)
  await deleteContentFromS3(data.uuid)
}

export const sqsPayloadProcessorHandler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  log('Received payload', event)
  for (const record of event.Records) {
    try {
      await exports.processSingleMessage(record)
    } catch (error: any) {
      logError(error)
      sendErrorEmail(event, error)
    }
  }
}
