import React from 'react';
import PropTypes from 'prop-types';

import { exportChart } from '../../../../explore/exploreUtils';
import SliceHeader from '../../../components/SliceHeader';
import ChartContainer from '../../../../chart/ChartContainer';
import { chartPropType } from '../../../../chart/chartReducer';
import { slicePropShape } from '../../../reducers/propShapes';

const propTypes = {
  id: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,

  // from redux
  chart: PropTypes.shape(chartPropType).isRequired,
  formData: PropTypes.object.isRequired,
  datasource: PropTypes.object.isRequired,
  slice: slicePropShape.isRequired,
  timeout: PropTypes.number.isRequired,
  filters: PropTypes.object.isRequired,
  refreshChart: PropTypes.func.isRequired,
  saveSliceName: PropTypes.func.isRequired,
  toggleExpandSlice: PropTypes.func.isRequired,
  addFilter: PropTypes.func.isRequired,
  removeFilter: PropTypes.func.isRequired,
  editMode: PropTypes.bool.isRequired,
  isExpanded: PropTypes.bool.isRequired,
};

const updateOnPropChange = Object.keys(propTypes)
  .filter(prop => prop !== 'width' && prop !== 'height');

class Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: props.width,
      height: props.height,
    };

    this.addFilter = this.addFilter.bind(this);
    this.exploreChart = this.exploreChart.bind(this);
    this.exportCSV = this.exportCSV.bind(this);
    this.forceRefresh = this.forceRefresh.bind(this);
    this.getFilters = this.getFilters.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.resize = this.resize.bind(this);
    this.setDescriptionRef = this.setDescriptionRef.bind(this);
    this.setHeaderRef = this.setHeaderRef.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.width !== this.state.width || nextState.height !== this.state.height) {
      return true;
    }

    for (let i = 0; i < updateOnPropChange.length; i += 1) {
      const prop = updateOnPropChange[i];
      if (nextProps[prop] !== this.props[prop]) {
        console.log(prop, 'changed')
        return true;
      }
    }

    if (nextProps.width !== this.props.width || nextProps.height !== this.props.height) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(this.resize, 350);
    }

    return false;
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
  }

  getFilters() {
    return this.props.filters;
  }

  getChartHeight() {
    const headerHeight = this.getHeaderHeight();
    const descriptionHeight = this.props.isExpanded && this.descriptionRef
      ? this.descriptionRef.offsetHeight : 0;

    return this.state.height - headerHeight - descriptionHeight;
  }

  getHeaderHeight() {
    return (this.headerRef && this.headerRef.offsetHeight) || 30;
  }

  setDescriptionRef(ref) {
    this.descriptionRef = ref;
  }

  setHeaderRef(ref) {
    this.headerRef = ref;
  }

  resize() {
    const { width, height } = this.props;
    this.setState(() => ({ width, height }));
  }

  addFilter(args) {
    this.props.addFilter(this.props.chart, ...args);
  }

  exploreChart() {
    exportChart(this.props.formData);
  }

  exportCSV() {
    exportChart(this.props.formData, 'csv');
  }

  forceRefresh() {
    return this.props.refreshChart(this.props.chart, true, this.props.timeout);
  }

  removeFilter(args) {
    this.props.removeFilter(this.props.id, ...args);
  }

  render() {
    const {
      id,
      chart,
      slice,
      datasource,
      isExpanded,
      editMode,
      formData,
      toggleExpandSlice,
      timeout,
    } = this.props;

    const { width } = this.state;
    const { queryResponse } = chart;
    const isCached = queryResponse && queryResponse.is_cached;
    const cachedDttm = queryResponse && queryResponse.cached_dttm;

    return (
      <div className="dashboard-chart">
        <SliceHeader
          innerRef={this.setHeaderRef}
          slice={slice}
          isExpanded={!!isExpanded}
          isCached={isCached}
          cachedDttm={cachedDttm}
          updateSliceName={this.updateSliceName}
          toggleExpandSlice={toggleExpandSlice}
          forceRefresh={this.forceRefresh}
          editMode={editMode}
          annotationQuery={chart.annotationQuery}
          exploreChart={this.exploreChart}
          exportCSV={this.exportCSV}
        />
        {/*
          This usage of dangerouslySetInnerHTML is safe since it is being used to render
          markdown that is sanitized with bleach. See:
             https://github.com/apache/incubator-superset/pull/4390
          and
             https://github.com/apache/incubator-superset/commit/b6fcc22d5a2cb7a5e92599ed5795a0169385a825
        */}
        <div
          className="slice_description bs-callout bs-callout-default"
          style={isExpanded ? null : { display: 'none' }}
          ref={this.setDescriptionRef}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: slice.description_markeddown }}
        />
        <ChartContainer
          containerId={`slice-container-${slice.slice_id}`}
          sliceId={id}
          datasource={datasource}
          formData={formData}
          headerHeight={this.getHeaderHeight()}
          height={this.getChartHeight()}
          width={width}
          timeout={timeout}
          vizType={slice.viz_type}
          addFilter={this.addFilter}
          getFilters={this.getFilters}
          removeFilter={this.removeFilter}
          annotationData={chart.annotationData}
          chartAlert={chart.chartAlert}
          chartStatus={chart.chartStatus}
          chartUpdateEndTime={chart.chartUpdateEndTime}
          chartUpdateStartTime={chart.chartUpdateStartTime}
          latestQueryFormData={chart.latestQueryFormData}
          lastRendered={chart.lastRendered}
          queryResponse={chart.queryResponse}
          queryRequest={chart.queryRequest}
          triggerQuery={chart.triggerQuery}
        />
      </div>
    );
  }
}

Chart.propTypes = propTypes;

export default Chart;