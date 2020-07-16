/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

var zrUtil = require('zrender/lib/core/util')

var graphic = require('echarts/lib/util/graphic')

var ChartView = require('echarts/lib/view/Chart')

const MyShape = graphic.extendShape({
  shape: {
    cx: 0,
    cy: 0,
    r: 0,
    startAngle: 0,
    endAngle: Math.PI * 2,
    clockwise: true,
    step: 0
  },
  style: {
    stroke: '#000',
    fill: null
  },
  buildPath: function (ctx, shape) {
    const x = shape.cx
    const y = shape.cy
    const r = Math.max(shape.r, 0) + 0.5
    const startAngle = shape.startAngle
    const endAngle = shape.endAngle
    const clockwise = shape.clockwise
    const unitX = Math.cos(startAngle)
    const unitY = Math.sin(startAngle)
    const unitXE = Math.cos(endAngle)
    const unitYE = Math.sin(endAngle)
    ctx.moveTo(unitX * r + x, unitY * r + y)
    ctx.arc(x, y, r, startAngle, endAngle, !clockwise)
    ctx.lineTo(unitXE * r + x, unitYE * r + y + shape.step)
    ctx.arc(x, y + shape.step, r, endAngle, startAngle, clockwise)
    ctx.lineTo(unitX * r + x, unitY * r + y)
  }
})
graphic.registerShape('myCustomShape', MyShape)

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

/**
 * @param {module:echarts/model/Series} seriesModel
 * @param {boolean} hasAnimation
 * @inner
 */
function updateDataSelected (uid, seriesModel, hasAnimation, api) {
  var data = seriesModel.getData()
  var dataIndex = this.dataIndex
  var name = data.getName(dataIndex)
  var selectedOffset = seriesModel.get('selectedOffset')
  api.dispatchAction({
    type: 'pieToggleSelect',
    from: uid,
    name: name,
    seriesId: seriesModel.id
  })
  data.each(function (idx) {
    toggleItemSelected(data.getItemGraphicEl(idx), data.getItemLayout(idx), seriesModel.isSelected(data.getName(idx)), selectedOffset, hasAnimation)
  })
}

/**
 * @param {module:zrender/graphic/Sector} el
 * @param {Object} layout
 * @param {boolean} isSelected
 * @param {number} selectedOffset
 * @param {boolean} hasAnimation
 * @inner
 */

function toggleItemSelected (el, layout, isSelected, selectedOffset, hasAnimation) {
  var midAngle = (layout.startAngle + layout.endAngle) / 2
  var dx = Math.cos(midAngle)
  var dy = Math.sin(midAngle)
  var offset = isSelected ? selectedOffset : 0
  var position = [dx * offset, dy * offset]
  hasAnimation // animateTo will stop revious animation like update transition
    ? el.animate().when(200, {
      position: position
    }).start('bounceOut') : el.attr('position', position)
}

/**
 * Piece of pie including Sector, Label, LabelLine
 * @constructor
 * @extends {module:zrender/graphic/Group}
 */

function PiePiece (data, idx, api) {
  graphic.Group.call(this)
  const center = [api.getWidth() / 2, api.getHeight() / 2]
  const scale = [1, 0.6]
  const origin = center
  var sector = new graphic.Sector({
    z2: 2,
    scale: scale,
    origin: origin
  })
  // var sector2 = new graphic.Sector({
  //   z2: 1,
  //   origin: [0, 40],
  //   scale: [1, 0.6]
  // })
  console.log('sector2')
  // var sector2 = new graphic.MyCustomShape({
  //   z2: 2,
  //   scale: [1, 0.6]
  // })
  var Sector2Class = graphic.getShapeClass('myCustomShape')
  var sector2 = new Sector2Class({
    z2: 1,
    scale: scale,
    origin: origin
  })
  console.log(sector2)
  var polyline = new graphic.Polyline()
  var text = new graphic.Text()
  this.add(sector)
  this.add(polyline)
  this.add(text)
  this.add(sector2)
  this.updateData(data, idx, true)
}

var piePieceProto = PiePiece.prototype

piePieceProto.updateData = function (data, idx, firstCreate) {
  console.log('')
  var sector = this.childAt(0)
  var labelLine = this.childAt(1)
  var labelText = this.childAt(2)
  var sector2 = this.childAt(3)
  console.log(sector2)
  var seriesModel = data.hostModel
  var itemModel = data.getItemModel(idx)
  var layout = data.getItemLayout(idx)
  var sectorShape = zrUtil.extend({}, layout)
  sectorShape.label = null
  var animationTypeUpdate = seriesModel.getShallow('animationTypeUpdate')

  if (firstCreate) {
    console.log('firstCreate')
    sector.setShape(sectorShape)
    sector2.setShape(sectorShape)
    sector2.shape.step = 40
    console.log(sector2)
    var animationType = seriesModel.getShallow('animationType')

    if (animationType === 'scale') {
      sector.shape.r = layout.r0
      sector2.shape.r = layout.r0
      graphic.initProps(sector, {
        shape: {
          r: layout.r
        }
      }, seriesModel, idx)
      graphic.initProps(sector2, {
        shape: {
          r: layout.r
        }
      }, seriesModel, idx)
    } else {
      sector.shape.endAngle = layout.startAngle
      sector2.shape.endAngle = layout.startAngle
      sector2.shape.step = 40
      console.log(sector2)
      graphic.updateProps(sector, {
        shape: {
          endAngle: layout.endAngle
        }
      }, seriesModel, idx)
      graphic.updateProps(sector2, {
        shape: {
          endAngle: layout.endAngle
        }
      }, seriesModel, idx)
    }
  } else {
    if (animationTypeUpdate === 'expansion') {
      // Sectors are set to be target shape and an overlaying clipPath is used for animation
      sector.setShape(sectorShape)
      sector2.setShape(sectorShape)
    } else {
      // Transition animation from the old shape
      graphic.updateProps(sector, {
        shape: sectorShape
      }, seriesModel, idx)
      graphic.updateProps(sector2, {
        shape: sectorShape
      }, seriesModel, idx)
    }
  } // Update common style

  var visualColor = data.getItemVisual(idx, 'color')
  sector.useStyle(zrUtil.defaults({
    lineJoin: 'bevel',
    fill: visualColor
  }, itemModel.getModel('itemStyle').getItemStyle()))
  console.log(visualColor)
  sector2.useStyle(zrUtil.defaults({
    lineJoin: 'bevel',
    fill: visualColor
  }, itemModel.getModel('itemStyle').getItemStyle()))
  sector.hoverStyle = itemModel.getModel('emphasis.itemStyle').getItemStyle()
  var cursorStyle = itemModel.getShallow('cursor')
  cursorStyle && sector.attr('cursor', cursorStyle) // Toggle selected

  toggleItemSelected(this, data.getItemLayout(idx), seriesModel.isSelected(data.getName(idx)), seriesModel.get('selectedOffset'), seriesModel.get('animation')) // Label and text animation should be applied only for transition type animation when update

  var withAnimation = !firstCreate && animationTypeUpdate === 'transition'

  this._updateLabel(data, idx, withAnimation)

  this.highDownOnUpdate = !seriesModel.get('silent') ? function (fromState, toState) {
    var hasAnimation = seriesModel.isAnimationEnabled() && itemModel.get('hoverAnimation')

    if (toState === 'emphasis') {
      labelLine.ignore = labelLine.hoverIgnore
      labelText.ignore = labelText.hoverIgnore // Sector may has animation of updating data. Force to move to the last frame
      // Or it may stopped on the wrong shape

      if (hasAnimation) {
        sector.stopAnimation(true)
        sector.animateTo({
          shape: {
            r: layout.r + seriesModel.get('hoverOffset')
          }
        }, 300, 'elasticOut')
      }
    } else {
      labelLine.ignore = labelLine.normalIgnore
      labelText.ignore = labelText.normalIgnore

      if (hasAnimation) {
        sector.stopAnimation(true)
        sector.animateTo({
          shape: {
            r: layout.r
          }
        }, 300, 'elasticOut')
      }
    }
  } : null
  graphic.setHoverStyle(this)
}

piePieceProto._updateLabel = function (data, idx, withAnimation) {
  console.log('_updateLabel')
  var labelLine = this.childAt(1)
  var labelText = this.childAt(2)
  var seriesModel = data.hostModel
  var itemModel = data.getItemModel(idx)
  var layout = data.getItemLayout(idx)
  var labelLayout = layout.label
  let visualColor = data.getItemVisual(idx, 'color')

  if (!labelLayout || isNaN(labelLayout.x) || isNaN(labelLayout.y)) {
    labelText.ignore = labelText.normalIgnore = labelText.hoverIgnore = labelLine.ignore = labelLine.normalIgnore = labelLine.hoverIgnore = true
    return
  }

  var targetLineShape = {
    points: labelLayout.linePoints || [[labelLayout.x, labelLayout.y], [labelLayout.x, labelLayout.y], [labelLayout.x, labelLayout.y]]
  }
  var targetTextStyle = {
    x: labelLayout.x,
    y: labelLayout.y
  }

  if (withAnimation) {
    graphic.updateProps(labelLine, {
      shape: targetLineShape
    }, seriesModel, idx)
    graphic.updateProps(labelText, {
      style: targetTextStyle
    }, seriesModel, idx)
  } else {
    labelLine.attr({
      shape: targetLineShape
    })
    labelText.attr({
      style: targetTextStyle
    })
  }

  labelText.attr({
    rotation: labelLayout.rotation,
    origin: [labelLayout.x, labelLayout.y],
    z2: 10
  })
  var labelModel = itemModel.getModel('label')
  var labelHoverModel = itemModel.getModel('emphasis.label')
  var labelLineModel = itemModel.getModel('labelLine')
  var labelLineHoverModel = itemModel.getModel('emphasis.labelLine')
  visualColor = data.getItemVisual(idx, 'color')
  graphic.setLabelStyle(labelText.style, labelText.hoverStyle = {}, labelModel, labelHoverModel, {
    labelFetcher: data.hostModel,
    labelDataIndex: idx,
    defaultText: labelLayout.text,
    autoColor: visualColor,
    useInsideStyle: !!labelLayout.inside
  }, {
    textAlign: labelLayout.textAlign,
    textVerticalAlign: labelLayout.verticalAlign,
    opacity: data.getItemVisual(idx, 'opacity')
  })
  labelText.ignore = labelText.normalIgnore = !labelModel.get('show')
  labelText.hoverIgnore = !labelHoverModel.get('show')
  labelLine.ignore = labelLine.normalIgnore = !labelLineModel.get('show')
  labelLine.hoverIgnore = !labelLineHoverModel.get('show') // Default use item visual color

  labelLine.setStyle({
    stroke: visualColor,
    opacity: data.getItemVisual(idx, 'opacity')
  })
  labelLine.setStyle(labelLineModel.getModel('lineStyle').getLineStyle())
  labelLine.hoverStyle = labelLineHoverModel.getModel('lineStyle').getLineStyle()
  var smooth = labelLineModel.get('smooth')

  if (smooth && smooth === true) {
    smooth = 0.4
  }

  labelLine.setShape({
    smooth: smooth
  })
}

zrUtil.inherits(PiePiece, graphic.Group) // Pie view

var PieView = ChartView.extend({
  type: 'pie3D',
  init: function () {
    var sectorGroup = new graphic.Group()
    this._sectorGroup = sectorGroup
  },
  render: function (seriesModel, ecModel, api, payload) {
    if (payload && payload.from === this.uid) {
      return
    }

    var data = seriesModel.getData()
    var oldData = this._data
    var group = this.group
    var hasAnimation = ecModel.get('animation')
    var isFirstRender = !oldData
    var animationType = seriesModel.get('animationType')
    var animationTypeUpdate = seriesModel.get('animationTypeUpdate')
    var onSectorClick = zrUtil.curry(updateDataSelected, this.uid, seriesModel, hasAnimation, api)
    var selectedMode = seriesModel.get('selectedMode')
    data.diff(oldData).add(function (idx) {
      var piePiece = new PiePiece(data, idx, api) // Default expansion animation

      if (isFirstRender && animationType !== 'scale') {
        piePiece.eachChild(function (child) {
          child.stopAnimation(true)
        })
      }

      selectedMode && piePiece.on('click', onSectorClick)
      data.setItemGraphicEl(idx, piePiece)
      group.add(piePiece)
    }).update(function (newIdx, oldIdx) {
      var piePiece = oldData.getItemGraphicEl(oldIdx)

      if (!isFirstRender && animationTypeUpdate !== 'transition') {
        piePiece.eachChild(function (child) {
          child.stopAnimation(true)
        })
      }

      piePiece.updateData(data, newIdx)
      piePiece.off('click')
      selectedMode && piePiece.on('click', onSectorClick)
      group.add(piePiece)
      data.setItemGraphicEl(newIdx, piePiece)
    }).remove(function (idx) {
      var piePiece = oldData.getItemGraphicEl(idx)
      group.remove(piePiece)
    }).execute()

    if (hasAnimation && data.count() > 0 && (isFirstRender ? animationType !== 'scale' : animationTypeUpdate !== 'transition')) {
      var shape = data.getItemLayout(0)

      for (var s = 1; isNaN(shape.startAngle) && s < data.count(); ++s) {
        shape = data.getItemLayout(s)
      }

      var r = Math.max(api.getWidth(), api.getHeight()) / 2
      var removeClipPath = zrUtil.bind(group.removeClipPath, group)
      group.setClipPath(this._createClipPath(shape.cx, shape.cy, r, shape.startAngle, shape.clockwise, removeClipPath, seriesModel, isFirstRender))
    } else {
      // clipPath is used in first-time animation, so remove it when otherwise. See: #8994
      group.removeClipPath()
    }

    this._data = data
  },
  dispose: function () {
  },
  _createClipPath: function (cx, cy, r, startAngle, clockwise, cb, seriesModel, isFirstRender) {
    console.log('_createClipPath')
    var clipPath = new graphic.Sector({
      shape: {
        cx: cx,
        cy: cy,
        r0: 0,
        r: r,
        startAngle: startAngle,
        endAngle: startAngle,
        clockwise: clockwise
      }
    })
    var initOrUpdate = isFirstRender ? graphic.initProps : graphic.updateProps
    initOrUpdate(clipPath, {
      shape: {
        endAngle: startAngle + (clockwise ? 1 : -1) * Math.PI * 2
      }
    }, seriesModel, cb)
    return clipPath
  },

  /**
   * @implement
   */
  containPoint: function (point, seriesModel) {
    var data = seriesModel.getData()
    var itemLayout = data.getItemLayout(0)

    if (itemLayout) {
      var dx = point[0] - itemLayout.cx
      var dy = point[1] - itemLayout.cy
      var radius = Math.sqrt(dx * dx + dy * dy)
      return radius <= itemLayout.r && radius >= itemLayout.r0
    }
  }
})
var _default = PieView
module.exports = _default
