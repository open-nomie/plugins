const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const dayOfYear = require('dayjs/plugin/dayOfYear');
const isoWeek = require('dayjs/plugin/isoWeek');
const relativeTime = require('dayjs/plugin/relativeTime')

dayjs.extend(relativeTime)
dayjs.extend(relativeTime)
dayjs.extend(weekOfYear)
dayjs.extend(advancedFormat)
dayjs.extend(dayOfYear)
dayjs.extend(isoWeek)

export default dayjs;