import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import DateRangepicker from './DateRangepicker';


const tabs = {
    ALL_ISSUES: "Alle Issues",
    GROUPED_BY_USER: "Gruppiert anhand User",
    TOTAL_TIME_PER_USER: "Gesamtzeit pro Nutzer",
    GROUPED_BY_USER_AND_CATEGORY: "Gruppiert nach Nutzer und Kategorie",
    BY_ISSUE: "Nach Issue"
};


const TimelogFetcher = () => {
const [timelogs, setTimelogs] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [displayMode, setDisplayMode] = useState(Tab.ALL_ISSUES);
const [startDate, setStartDate] = useState(new Date('2024-10-01'));
const [endDate, setEndDate] = useState(new Date('2025-10-1'));





const tableHeaders = {
    user: "User",
    requirementsEngineering: "Requirements Engineering",
    entwurf: "Entwurf",
    architektur: "Architektur",
    backend: "Backend",
    frontend: "Frontend",
    projektmanagement: "Projektmanagement"
};




    const fetchTimelogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios({
                url: 'https://gitlab.com/api/graphql',
                method: 'post',
                headers: {
                    Authorization: 'Bearer glpat-xdacoJdsZsS34HWxWT21',
                    'Content-Type': 'application/json',
                },
                data: {
                    query: `
                    {
                      group(fullPath: "dhbw-se/se-tinf23b6/G5-investment-app") {
                        timelogs(startDate: "${startDate.toISOString()}", endDate: "${endDate.toISOString()}") {
                          nodes {
                            user {
                              name
                            }
                            issue {
                              title
                              iid
                              labels {
                                nodes {
                                  title
                                }
                              }
                            }
                            spentAt
                            timeSpent
                            note {
                              body
                            }
                          }
                        }
                      }
                    }
                  `,
                },
            });

            const timelogsData = response.data.data.group.timelogs.nodes;
            setTimelogs(timelogsData);
        } catch (err) {
            setError('Error fetching timelogs');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {  
        fetchTimelogs();
        setDisplayMode(displayMode || tabs.ALL_ISSUES);
     }, []);
     

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;
    }

    const handleDisplayChange = (event) => {
        switch (event) {
           case 0: setDisplayMode(tabs.ALL_ISSUES); break;
           case 1: setDisplayMode(tabs.GROUPED_BY_USER); break;
           case 2: setDisplayMode(tabs.TOTAL_TIME_PER_USER); break;
           case 3: setDisplayMode(tabs.GROUPED_BY_USER_AND_CATEGORY); break;
           case 4: setDisplayMode(tabs.BY_ISSUE); break;
           default: setDisplayMode(tabs.ALL_ISSUES); break;
        }
    };

    const renderTimelogs = () => {
        let content = null;

        timelogs.sort((a, b) => new Date(b.spentAt) - new Date(a.spentAt));

        if (displayMode === tabs.ALL_ISSUES) {
            content =  timelogs.map((log, index) => (
                <tr key={index}>
                    <td>{log.user.name}</td>
                    <td><a target="_blank" rel="noreferrer" href={"https://gitlab.com/dhbw-se/se-tinf23b6/G5-investment-app/investment-app/-/issues/" + log.issue?.iid}>{log.issue?.title || ''}</a></td>
                    <td>{new Date(log.spentAt).toLocaleDateString()}</td>
                    <td>{formatTime(log.timeSpent)}</td>
                </tr>
            ));

        }         

        else if (displayMode === tabs.GROUPED_BY_USER) {
            const users = timelogs.reduce((acc, log) => {
                if (!acc[log.user.name]) acc[log.user.name] = [];
                acc[log.user.name].push(log);
                return acc;
            }, {});

            content =  Object.keys(users).map((user, idx) => (
                <React.Fragment key={idx}>
                    <tr>
                        <td colSpan={1}><strong>{user}</strong></td>
                    </tr>
                    {users[user].map((log, index) => (
                        <tr key={index}>
                            <td><a
                                href={"https://gitlab.com/dhbw-se/se-tinf23b6/G5-investment-app/investment-app/-/issues/" + log.issue?.iid}>{log.issue?.title || ''}</a>
                            </td>
                            <td>{new Date(log.spentAt).toLocaleDateString()}</td>
                            <td>{formatTime(log.timeSpent)}</td>
                        </tr>
                    ))}
                </React.Fragment>
            ));
        } else if (displayMode === tabs.TOTAL_TIME_PER_USER) {
            let total = 0;
            const userTotalTimes = timelogs.reduce((acc, log) => {
                if (!acc[log.user.name]) acc[log.user.name] = 0;
                acc[log.user.name] += log.timeSpent;
                total += log.timeSpent;
                return acc;
            }, {});

            const keys = Object.keys(userTotalTimes).map((user, index) => (
                <tr key={index}>
                    <td><strong>{user}</strong></td>
                    <td><strong>{formatTime(userTotalTimes[user])}</strong></td>
                </tr>
            ));

            keys.push((
                <tr key={keys.length}>
                    <td><strong>Total</strong></td>
                    <td><strong>{formatTime(total)}</strong></td>
                </tr>
            ))
            content =  keys;

        } else if (displayMode === tabs.GROUPED_BY_USER_AND_CATEGORY) {
            const categories = {
                "Requirements Engineering": ["Requirements Engineering"],
                "Architektur": ["Architektur"],
                "Team": ["Frontend", "Backend"],
                "Projektmanagement": ["Projektmanagement"],
                "Backend": ["Backend"],
                "Frontend": ["Frontend"],
            };

            const userCategoryTotals = timelogs.reduce((acc, log) => {
                const user = log.user.name;
                const issueLabels = log.issue.labels.nodes.map(label => label.title);

                if (!acc[user]) {
                    acc[user] = Object.keys(tableHeaders).reduce((obj, key) => {
                        obj[key] = 0;
                        return obj;
                    }, {});
                }

                for (const [category, labels] of Object.entries(categories)) {
                    if (issueLabels.some(label => labels.includes(label))) {
                        acc[user][category] += log.timeSpent;
                    }
                }

                return acc;
            }, {});
            
            
            content =  Object.keys(userCategoryTotals).map((user, idx) => (
                <tr key={idx}>
                    <td><strong>{user}</strong></td>
                    <td>{formatTime(userCategoryTotals[user].requirementsEngineering)}</td>
                    <td>{formatTime(userCategoryTotals[user].entwurf)}</td>
                    <td>{formatTime(userCategoryTotals[user].architektur)}</td>
                    <td>{formatTime(userCategoryTotals[user].backend)}</td>
                    <td>{formatTime(userCategoryTotals[user].frontend)}</td>
                    <td>{formatTime(userCategoryTotals[user].projektmanagement)}</td>
                </tr>
            ));
        }
        else if (displayMode === tabs.BY_ISSUE) {
            // Group and sum time spent by issue
            const issueSummary = timelogs.reduce((acc, log) => {
              const issueId = log.issue?.iid || 'Unknown Issue';
              const issueTitle = log.issue?.title || 'No Title';
          
              if (!acc[issueId]) {
                acc[issueId] = { title: issueTitle, totalTimeSpent: 0 };
              }
          
              acc[issueId].totalTimeSpent += log.timeSpent; // Sum up time spent
              return acc;
            }, {});
          
            // Convert the summary object to a displayable array
            content = Object.entries(issueSummary).map(([issueId, data]) => (
              <tr key={issueId}>
                <td>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={
                      "https://gitlab.com/dhbw-se/se-tinf23b6/G5-investment-app/investment-app/-/issues/" +
                      issueId
                    }
                  >
                    {data.title}
                  </a>
                </td>
                <td>{formatTime(data.totalTimeSpent)}</td>
              </tr>
            ));
          }


        return (
            <>
                 { loading ? (
                    <p>Loading timelogs...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <div className='center '>
                        <table >
                            <thead>
                            <tr className='tr-header'>
                                {displayMode === tabs.ALL_ISSUES ? 
                                    <>
                                        <th>User</th> 
                                        <th>Issue</th>
                                        <th>Date</th>
                                        <th>Spented Time</th>
                                    </> 
                                :
                                displayMode === tabs.GROUPED_BY_USER ?
                                    <>
                                        <th>Date</th>
                                        <th>Spented Time</th>
                                    </>
                                :
                                    <></>
                            }
                            </tr>
                            </thead>
                        <tbody>
                        {content}
                        </tbody>
                    </table>
                    </div>
                    )}

            </>
        

        )

    };


    const onGetDate = (state) => {
        setStartDate(state.startDate);
        setEndDate(state.endDate);
    }


    return (
        <div>
            <div className={"container"}>
              <div className="date-range">
                <DateRangepicker onGetState={onGetDate}/>
                <button className={"button-report"} onClick={fetchTimelogs}>Report erstellen</button>
              </div>

                <Tabs className={"tab-container"} defaultIndex={0} onSelect={(index) => handleDisplayChange(index)} >  
                    <TabList>
                        <Tab>{tabs.ALL_ISSUES}</Tab>
                        <Tab>{tabs.GROUPED_BY_USER}</Tab>
                        <Tab>{tabs.TOTAL_TIME_PER_USER}</Tab>
                        <Tab>{tabs.GROUPED_BY_USER_AND_CATEGORY}</Tab>
                        <Tab>{tabs.BY_ISSUE}</Tab>
                    </TabList>
                    <TabPanel>
                        {renderTimelogs()}
                    </TabPanel>
                    <TabPanel>
                       {renderTimelogs()}
                    </TabPanel>
                    <TabPanel>
                        {renderTimelogs()}
                    </TabPanel>
                    <TabPanel>
                        {renderTimelogs()}
                    </TabPanel>
                    <TabPanel>
                        {renderTimelogs()}
                    </TabPanel>
                </Tabs>
            </div>

        </div>
    );
}
;

export default TimelogFetcher;

