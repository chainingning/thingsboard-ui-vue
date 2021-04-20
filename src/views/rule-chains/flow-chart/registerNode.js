import G6Editor from '@antv/g6-editor'

G6Editor.Flow.registerNode('custom-rect', {
  draw (item) {
    const group = item.getGraphicGroup()
    const model = item.getModel()
    const size = model.size.split('*')
    const width = Number(size[0])
    const height = Number(size[1])
    const keyShape = group.addShape('rect', {
      attrs: {
        x: 0,
        y: 0,
        width,
        height,
        radius: 4,
        fill: model.style.fill
      }
    })
    group.addShape('text', {
      attrs: {
        x: width / 2,
        y: 10,
        text: model.label.text,
        fontSize: 14,
        textAlign: 'center',
        textBaseline: 'top',
        fill: model.label.fill
      }
    })
    if (model.nodeType !== 'RULECHAIN') {
      const lifeState = (model.lifeState && model.lifeState.toLocaleLowerCase()) || null
      const img = `./images/${lifeState}.png`
      group.addShape('image', {
        attrs: {
          img: require(`${img}`),
          x: width - 21,
          y: height / 2 / 2 - 10,
          width: 20,
          height: 20
        }
      })
      const debugMode = model.debugMode
      if (debugMode) {
        group.addShape('image', {
          attrs: {
            img: require('./images/debug.png'),
            x: width - 21,
            y: height / 2 + height / 2 / 2 - 10,
            width: 20,
            height: 20
          }
        })
      }
    }
    return keyShape
  },
  anchor: [
    [0, 0.5], [1, 0.5]
  ]
})

G6Editor.Flow.registerNode('root-rect', {
  draw (item) {
    const group = item.getGraphicGroup()
    const model = item.getModel()
    const size = model.size.split('*')
    const width = Number(size[0])
    const height = Number(size[1])
    const keyShape = group.addShape('rect', {
      attrs: {
        x: 0,
        y: 0,
        width,
        height,
        radius: 4,
        fill: model.style.fill
      }
    })
    group.addShape('text', {
      attrs: {
        x: width / 2,
        y: 16,
        text: model.label.text,
        fontSize: 14,
        textAlign: 'center',
        textBaseline: 'top',
        fill: model.label.fill
      }
    })
    return keyShape
  },
  anchor: [
    [1, 0.5]
  ]
})
