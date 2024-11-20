import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { DateRangePicker } from 'react-date-range';
import { DefinedRange } from 'react-date-range';


import { addDays } from 'date-fns';
import { useEffect, useState } from 'react';


const DateRangepicker = ({onGetState}) =>{




    const [state, setState] = useState({
        selection: {
          startDate: new Date(),
          endDate: null,
          key: 'selection'
        },
        compare: {
          startDate: new Date(),
          endDate: addDays(new Date(), 3),
          key: 'compare'
        }
      });

      const onChange = (item) => {
        setState({ ...state, ...item });
        onGetState({startDate: item.selection.startDate, endDate: item.selection.endDate});
        
      }

    return (
        <>
            <DateRangePicker
            onChange={onChange}
            months={1}
            minDate={addDays(new Date(), -300)}
            maxDate={addDays(new Date(), 900)}
            direction="vertical"
            scroll={{ enabled: false }}
            ranges={[state.selection]}
            showMonthArrow={true}
            
            />
        </>
    );

}


export default DateRangepicker;