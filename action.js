module.exports = function(loader, toggl, timeSlotter, asker, config) {

  this.run = async () => {
    const moment = loader.load('moment')

    const start = moment().startOf('day').add(-config.lookBehindDays, 'day')
    const end = moment().endOf('day').add(config.lookForwardDays, 'day')

    const holes = await toggl.getTimeEntriesHoles(start, end)
    const slots = await timeSlotter.slotsInMany(holes)
    const selectedSlots = await asker.pickSlots(slots)
    const squashedSlots = await timeSlotter.squash(selectedSlots)

    const { project, task, description } = await chooseProjectTaskAndDescription(toggl, asker)

    toggl.createTimeEntries(project, task, description, squashedSlots)
  }

  this.help = () => {
    return "compile not-filled selected past (and future) holes"
  }
}

async function chooseProjectTaskAndDescription (toggl, asker) {
  const clients = await toggl.getClients()
  const projects = await toggl.getActiveProjects()
  const project = await asker.chooseProject(projects, clients)
  const tasks = await toggl.getTasks(project.id)

  const task = tasks.length > 1 ? await asker.chooseTask(tasks) : tasks[0]
  const description = await asker.input('What have you done?')

  return { project, task, description }
}