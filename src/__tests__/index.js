import { shallowMount, mount } from "@vue/test-utils"
import VueSpeedometer from "../index"
import { debounce } from "lodash"

// import validators
import {
  calculateNeedleHeight,
  calculateScale,
  calculateTicks,
  calculateSegmentLabelCount,
} from "../core/util"

// helper function to mount with default options to attach to dom
const _mount = (options) =>
  mount(VueSpeedometer, {
    attachToDocument: true,
    ...options,
  })

// we are using a debounced update Reading function
// debounce our assertion too
const debouncedCheck = (fn) =>
  debounce(fn, 0, {
    leading: false,
    trailing: true,
  })

const nextTickUpdateCheck = (wrapper, fn) => {
  return wrapper.vm.$nextTick().then(debouncedCheck(fn))
}

describe("<vue-speedometer />", () => {
  test("is a vue instance", () => {
    const wrapper = _mount()
    expect(wrapper.isVueInstance()).toBeTruthy()
  })

  // test if it has the parent div component for the "svg"
  test("should render one parent div component", () => {
    const wrapper = _mount()
    expect(wrapper.contains("div")).toBeTruthy()
  })

  // test if we 'created' is called
  test("'created' => called once", () => {
    const _initWatchers = jest.fn()
    _mount({
      methods: {
        _initWatchers,
      },
    })
    expect(_initWatchers).toHaveBeenCalledTimes(1)
  })

  // test if we have the 'svg.speedometer'
  test("svg.speedometer is present", () => {
    const wrapper = _mount()
    expect(wrapper.find("svg.speedometer").exists()).toBe(true)
  })

  // check if the default segments is 5 by counting 'speedo-segment'
  test("by default we should have 5 segments", () => {
    const wrapper = _mount()
    expect(wrapper.findAll("path.speedo-segment").length).toBe(5)
  })

  // check the text color of the current value is the default (#666)
  test("should have the default text color for current value", () => {
    const wrapper = _mount()
    expect(wrapper.find("text.current-value").element.style.fill).toBe("#666")
  })

  // should take the color given by us in 'textColor'
  test("should have the text color given by us => steelblue ", () => {
    const wrapper = _mount({
      propsData: {
        textColor: "steelblue",
      },
    })
    expect(wrapper.find("text.current-value").element.style.fill).toBe(
      "steelblue"
    )
  })

  // should smoothly animate only the current value; not other breaking changes
  test("smooth update of values", () => {
    const value = 333
    const updatedValue = 470
    const full_dom_wrapper = _mount({
      propsData: {
        value,
      },
    })
    expect(full_dom_wrapper.find("text.current-value").text()).toBe(
      value.toString()
    )

    expect(
      full_dom_wrapper
        .findAll("path.speedo-segment")
        .at(0)
        .attributes("fill")
    ).toBe(`rgb(255, 71, 26)`) // rgb value of our default 'startColor'

    // set updated props
    full_dom_wrapper.setProps({
      value: updatedValue,
      startColor: "red",
    })

    // confirm our start color is intact
    expect(
      full_dom_wrapper
        .findAll("path.speedo-segment")
        .at(0)
        .attributes("fill")
    ).toBe(`rgb(255, 71, 26)`) // rgb value of our default 'startColor'

    return full_dom_wrapper.vm.$nextTick().then(
      debouncedCheck(() => {
        expect(full_dom_wrapper.find("text.current-value").text()).toBe(
          updatedValue.toString()
        )
      })
    )
  })

  // check the format of the values
  test("should display the format of the values correctly", () => {
    // checking the default value
    const full_dom_wrapper = _mount()
    expect(full_dom_wrapper.find("text.current-value").text()).toBe("0")
    // setting label format to "d" and verifying the resulting value
    let passed_value = 477.7,
      transformed_value = "478"
    // change the props
    full_dom_wrapper.setProps({
      value: passed_value,
      valueFormat: "d",
    })

    // test if the formatting reflects the expected value
    return nextTickUpdateCheck(full_dom_wrapper, () => {
      expect(full_dom_wrapper.find("text.current-value").text()).toBe(
        transformed_value
      )
    })
  })

  // check the custom value text
  test("should display custom current text value", () => {
    // checking the default value
    const full_dom_wrapper = _mount({
      propsData: {
        value: 333,
        currentValueText: "Porumai: ${value}",
      },
    })
    expect(full_dom_wrapper.find("text.current-value").text()).toBe(
      "Porumai: 333"
    )
    // change props to another text
    full_dom_wrapper.setProps({
      value: 555,
      currentValueText: "Current Value: ${value}",
    })
    // test current value text reflects our new props
    return nextTickUpdateCheck(full_dom_wrapper, () => {
      expect(full_dom_wrapper.find("text.current-value").text()).toBe(
        "Current Value: 555"
      )
    })
  })

  // it should not break on invalid needle transition
  test("should not break on invalid needle transition", () => {
    const wrapper = _mount({
      propsData: {
        needleTransition: "porumai-transition",
      },
    })
    expect(wrapper.findAll("path.speedo-segment").length).toBe(5)
  })

  test("should throw error on invalid needle height", () => {
    expect(() =>
      calculateNeedleHeight({ heightRatio: 1.1, radius: 2 })
    ).toThrowError()
    // this one should not throw and should return some value
    expect(() =>
      calculateNeedleHeight({ heightRatio: 0.9, radius: 2 })
    ).not.toThrowError()
    expect(typeof calculateNeedleHeight({ heightRatio: 0.9, radius: 2 })).toBe(
      "number"
    )
  })

  test("should correctly take current Value placeholder from passed props", () => {
    const current_value = 333
    const wrapper = _mount({
      propsData: {
        value: current_value,
        currentValuePlaceholderStyle: "#{value}",
        currentValueText: "#{value}",
      },
    })
    expect(wrapper.find("text.current-value").text()).toEqual(
      current_value.toString()
    )
  })

  test("scale and ticks works properly", () => {
    const min = 0
    const max = 1000
    const segments = 1000
    const max_segment_labels = 10

    const full_dom_wrapper = _mount({
      propsData: {
        segments,
        maxSegmentLabels: max_segment_labels,
      },
    })

    const scale1 = calculateScale({ min, max, segments })
    const ticks1 = calculateTicks(scale1, { min, max, segments })

    const scale2 = calculateScale({ min, max, segments: max_segment_labels })
    const ticks2 = calculateTicks(scale2, {
      min,
      max,
      segments: max_segment_labels,
    })

    const scale3 = calculateScale({ min, max, segments: 1 })
    const ticks3 = calculateTicks(scale3, { min, max, segments: 1 })

    expect(ticks2.length).toBeLessThan(ticks1.length)
    expect(ticks3.length).toBe(2)

    expect(full_dom_wrapper.findAll("text.segment-value").length).toBe(
      ticks2.length
    )
  })

  test("'maxSegmentLabels' config with no labels ", () => {
    const min = 0
    const max = 1000
    let segments = 1000
    let max_segment_labels = 0
    let label_count = calculateSegmentLabelCount({
      maxSegmentLabelCount: max_segment_labels,
      segmentCount: segments,
    })

    const full_dom_wrapper = _mount({
      propsData: {
        segments,
        maxSegmentLabels: max_segment_labels,
      },
    })

    const scale1 = calculateScale({ min, max, segments })
    const ticks1 = calculateTicks(scale1, { min, max, segments: label_count })
    expect(full_dom_wrapper.findAll("text.segment-value").length).toBe(
      max_segment_labels
    )
  })

  test("custom segment colors", () => {
    const segmentColors = ["red", "blue", "green"]
    const full_dom_wrapper = _mount({
      propsData: {
        segments: 3,
        segmentColors,
      },
    })

    segmentColors.forEach((color, index) => {
      expect(
        full_dom_wrapper
          .findAll("path.speedo-segment")
          .at(index)
          .attributes("fill")
      ).toEqual(color)
    })
  })
})

describe("<vue-speedometer /> rendering, update and forceRender", () => {
  test("Mock updating and force renders", () => {
    const renderGauge = jest.fn(() => {
      // console.log("porumai! renderGauge")
    })
    const updateReadings = jest.fn(function({ force_render }) {
      if (force_render) {
        renderGauge()
      } else {
        // console.log("porumai! JUST updating readings ")
      }
    })
    const _updateReadings = jest.fn(() => {
      // console.log("porumai! __update READINGs")
    })
    const _initWatchers = jest.fn(function() {
      // console.log("porumai! initing watchers ")
    })
    const watchUpdater = jest.fn(function(options) {
      // console.log("porumai watch updater ", options)
      updateReadings(options)
    })
    const $watch = jest.fn(watchUpdater)

    const wrapper = _mount({
      mocks: {
        updateReadings,
        $watch,
      },
      methods: {
        renderGauge,
        _updateReadings,
        _initWatchers,
        watchUpdater,
      },
    })

    expect(_initWatchers).toHaveBeenCalledTimes(1)
    expect(renderGauge).toHaveBeenCalledTimes(1)

    renderGauge.mockClear()
    updateReadings.mockClear()

    // mock watch updater to trigger value updates
    watchUpdater({
      prop: "value",
      newValue: 333,
      force_render: wrapper.vm.force_render,
    })

    expect(renderGauge).toHaveBeenCalledTimes(0)
    expect(wrapper.vm.updateReadings).toHaveBeenCalledTimes(1)

    renderGauge.mockClear()
    updateReadings.mockClear()

    // now try to force render
    wrapper.setData({
      force_render: true,
    })

    watchUpdater({
      prop: "value",
      newValue: 333,
      force_render: wrapper.vm.force_render,
    })

    expect(renderGauge).toHaveBeenCalledTimes(1)
  })

  const wrapper = _mount()

  // if force render is present, it should re render the whole component
  test('should rerender the whole component when "forceRender: true" ', () => {
    expect(wrapper.findAll("path.speedo-segment").length).toBe(5)
    // change the props and give 'rerender' true
    wrapper.setProps({
      segments: 10,
      // set force render to true so that we should get 10 segments
      forceRender: true,
    })

    return wrapper.vm.$nextTick().then(
      debouncedCheck(() => {
        expect(wrapper.findAll("path.speedo-segment").length).toBe(10)
      })
    )
  })
  test('should not rerender when "forceRender: false" ', () => {
    // now change the forceRender option to false
    wrapper.setProps({
      segments: 15,
      // set force render to true so that we should get 10 segments
      forceRender: false,
    })

    // the segments should remain in 10
    return nextTickUpdateCheck(wrapper, () => {
      expect(full_dom_wrapper.render().find("path.speedo-segment").length).toBe(
        10
      )
    })
  })
})