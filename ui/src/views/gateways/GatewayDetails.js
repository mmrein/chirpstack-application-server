import React, { Component } from "react";

import { withStyles } from "@material-ui/core/styles";
import Paper from '@material-ui/core/Paper';
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from '@material-ui/core/Grid';

import moment from "moment";
import { Map, Marker } from 'react-leaflet';
import { Line } from "react-chartjs-2";

import MapTileLayer from "../../components/MapTileLayer";
import GatewayStore from "../../stores/GatewayStore";


const styles = {
  chart: {
    height: 300,
  },
};


class GatewayDetails extends Component {
  constructor() {
    super();
    this.state = {
      statsUpDn: [],
      //statsUp: [],
      //statsDown: [],
      statusGw: []
    };
    this.loadStats = this.loadStats.bind(this);
    this.loadStatus = this.loadStatus.bind(this);
  }

  componentDidMount() {
    this.loadStats();
    this.loadStatus();
  }

  loadStats() {
    const end = moment().toISOString()
    const start = moment().subtract(30, "days").toISOString()
    const interval = "DAY"

    GatewayStore.getStats(this.props.match.params.gatewayID, interval, start, end, resp => {
      let statsUpDn = {
        labels: [],
        datasets: [
          {
            label: "rx received",   // Draw in green
            borderColor: "rgba(25, 136, 68, 1)",
            backgroundColor: "rgba(0, 0, 0, 0)",
            lineTension: 0,
            pointBackgroundColor: "rgba(25, 136, 68, 1)",
            data: [],
          },
          {
            label: "tx emitted",    // Draw in red
            borderColor: "rgba(204, 52, 43, 1)",
            backgroundColor: "rgba(0, 0, 0, 0)",
            lineTension: 0,
            pointBackgroundColor: "rgba(204, 52, 43, 1)",
            data: [],
          },
        ],
      }

      for (const row of resp.result) {
        statsUpDn.labels.push(moment(row.timestamp).format("Do"));
        statsUpDn.datasets[0].data.push(row.rxPacketsReceivedOK);
        statsUpDn.datasets[1].data.push(row.txPacketsEmitted); 
      }

      this.setState({
        statsUpDn: statsUpDn,
      });
    });
  }

  loadStatus() {
    const end = moment().toISOString()
    const start = moment().subtract(2, "hours").toISOString()
    const interval = "MINUTE"
    
    GatewayStore.getStats(this.props.match.params.gatewayID, interval, start, end, resp => {
      let statusGw = {
        labels: [],
        datasets: [
          {
            label: "status",
            borderColor: "rgba(33, 150, 243, 1)",
            backgroundColor: "rgba(0, 0, 0, 0)",
            lineTension: 0,
            pointBackgroundColor: "rgba(33, 150, 243, 1)",
            data: [],
          },
        ],
      }
      
      for (const row of resp.result) {
        statusGw.labels.push(moment(row.timestamp).format("H:mm"));
        if ((row.rxPacketsReceived + row.rxPacketsReceivedOK + row.txPacketsReceived + row.txPacketsEmitted) > 0) {
          statusGw.datasets[0].data.push(1);	
        } else {
          statusGw.datasets[0].data.push(0);	
        }   // Using example values
      }
      this.setState({
        statusGw: statusGw
      });
    });
  }

  render() {
    if (this.props.gateway === undefined || this.state.statsUpDn === undefined || this.state.statusGw === undefined) {
      return(<div></div>);
    }

    const style = {
      height: 400,
    };

    const statsOptions = {
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
          },
        }],
      },
    }

    let position = [];
    if (typeof(this.props.gateway.location.latitude) !== "undefined" && typeof(this.props.gateway.location.longitude !== "undefined")) {
      position = [this.props.gateway.location.latitude, this.props.gateway.location.longitude]; 
    } else {
      position = [0,0];
    }

    let lastSeenAt = "Never";
    if (this.props.lastSeenAt !== null) {
      lastSeenAt = moment(this.props.lastSeenAt).format("lll");
    }

    return(
      <Grid container spacing={4}>
        <Grid item xs={6}>
          <Card>
            <CardHeader
              title="Gateway details"
            />
            <CardContent>
              <Typography variant="subtitle1" color="primary">
                Gateway ID
              </Typography>
              <Typography variant="body1" gutterBottom>
                {this.props.gateway.id}
              </Typography>
              <Typography variant="subtitle1" color="primary">
                Altitude
              </Typography>
              <Typography variant="body1" gutterBottom>
                {this.props.gateway.location.altitude} meters
              </Typography>
              <Typography variant="subtitle1" color="primary">
                GPS coordinates
              </Typography>
              <Typography variant="body1" gutterBottom>
                {this.props.gateway.location.latitude}, {this.props.gateway.location.longitude}
              </Typography>
              <Typography variant="subtitle1" color="primary">
                Last seen at
              </Typography>
              <Typography variant="body1" gutterBottom>
                {lastSeenAt}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Paper>
            <Map center={position} zoom={15} style={style} animate={true} scrollWheelZoom={false}>
              <MapTileLayer />
              <Marker position={position} />
            </Map>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Gateway status" />
            <CardContent className={this.props.classes.chart}>
              <Line height={75} options={statsOptions} data={this.state.statusGw} redraw />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Frames received / transmitted" />
            <CardContent className={this.props.classes.chart}>
              <Line height={75} options={statsOptions} data={this.state.statsUpDn} redraw />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(GatewayDetails);
