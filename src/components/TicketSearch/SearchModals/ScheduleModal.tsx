import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "./ScheduleModal.scss";
import useCheckWindowWidth from "@/hook/useCheckWindowWidth";

interface ISchedule {
  departureDate: string;
  returnDate: string;
  departureFormattedDate: string;
  returnFormattedDate: string;
}

interface ScheduleModalProps {
  tripType: string;
  handleClose: (a: boolean) => void;
  schedule: ISchedule;
  setSchedule: (obj: ISchedule) => void;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const ScheduleModal = ({
  tripType,
  handleClose,
  schedule,
  setSchedule,
}: ScheduleModalProps) => {
  const isWeb = useCheckWindowWidth(1024);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  const [dates, setDates] = useState<Value>();

  /* -------------------------------------------------------------------------- */
  /*                              왕복/편도 변경 시 선택 초기화                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    // 편도 -> 왕복으로 갈 때는 초기화가 안 되는 문제 해결하기
    setDates(tripType === "round" ? [null, null] : null);
  }, [tripType]);

  /* -------------------------------------------------------------------------- */
  /*                                 편도 날짜 형식 수정                             */
  /* -------------------------------------------------------------------------- */
  const formatDate = (data: Date) => {
    const date = new Date(data);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const year = date.getFullYear();
    const month1 = date.getMonth() + 1;
    const month2 = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];

    const formattedDate = `${month1}월 ${day}일 (${dayOfWeek})`;
    const selectedDate = `${year}-${month2}-${day}`;

    return { formattedDate, selectedDate };
  };

  /* -------------------------------------------------------------------------- */
  /*                                 왕복 날짜 형식 수정                             */
  /* -------------------------------------------------------------------------- */
  const formatDates = (data: [Date, Date]) => {
    let formattedDates: string[] = [];
    let selectedDates: string[] = [];

    data.forEach((item) => {
      const { formattedDate, selectedDate } = formatDate(item);
      formattedDates.push(formattedDate);
      selectedDates.push(selectedDate);
    });

    return { formattedDates, selectedDates };
  };

  /* -------------------------------------------------------------------------- */
  /*                                  이전 달로 이동                               */
  /* -------------------------------------------------------------------------- */
  const handlePrevClick = () => {
    if (isWeb) {
      if (calendarDate) {
        const prevMonthDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 2,
          1
        );

        if (
          prevMonthDate >=
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ) {
          setCalendarDate(prevMonthDate);
          setActiveStartDate(prevMonthDate);
        }
      }
    } else {
      if (calendarDate) {
        const prevMonthDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() - 1,
          1
        );

        if (
          prevMonthDate >=
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        ) {
          setCalendarDate(prevMonthDate);
          setActiveStartDate(prevMonthDate);
        }
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                  다음 달로 이동                               */
  /* -------------------------------------------------------------------------- */
  const handleNextClick = () => {
    if (isWeb) {
      if (calendarDate) {
        const nextMonthDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 2,
          1
        );
        setCalendarDate(
          new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() - 1, 1)
        );
        setCalendarDate(nextMonthDate);
        setActiveStartDate(nextMonthDate);
      }
    } else {
      if (calendarDate) {
        const nextMonthDate = new Date(
          calendarDate.getFullYear(),
          calendarDate.getMonth() + 1,
          1
        );
        setCalendarDate(
          new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() - 1, 1)
        );
        setCalendarDate(nextMonthDate);
        setActiveStartDate(nextMonthDate);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                  날짜 선택 완료                               */
  /* -------------------------------------------------------------------------- */
  const handleDone = () => {
    if (dates instanceof Array) {
      if (dates[0] && dates[1]) {
        const result = formatDates(dates as [Date, Date]);
        setSchedule({
          departureDate: result.selectedDates[0],
          departureFormattedDate: result.formattedDates[0],
          returnDate: result.selectedDates[1],
          returnFormattedDate: result.formattedDates[1],
        });
        handleClose(false);
      } else if (!schedule.departureDate) {
        alert("일정 선택을 완료해주세요!");
      } else {
        handleClose(false);
      }
    } else {
      if (dates) {
        const result = formatDate(dates);
        setSchedule({
          departureDate: result.selectedDate,
          departureFormattedDate: result.formattedDate,
          returnDate: "",
          returnFormattedDate: "",
        });
        handleClose(false);
      } else if (!schedule.departureDate) {
        alert("일정 선택을 완료해주세요!");
      } else {
        handleClose(false);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   달력에 표시                                 */
  /* -------------------------------------------------------------------------- */
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const isCurrent = date.toDateString() === new Date().toDateString();

      return <div>{isCurrent && <span className="tile-today">오늘</span>}</div>;
    }
    return null;
  };

  /* -------------------------------------------------------------------------- */
  /*                                   월 변경 방지                                  */
  /* -------------------------------------------------------------------------- */
  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      if (
        activeStartDate.getMonth() !== calendarDate.getMonth() ||
        activeStartDate.getFullYear() !== calendarDate.getFullYear()
      ) {
        setActiveStartDate(calendarDate); // Maintain the current calendar date
      } else {
        setActiveStartDate(activeStartDate);
      }
    }
  };

  return (
    <div className="schedule-modal">
      <button
        className="close-button"
        type="button"
        onClick={() => handleClose(false)}
      >
        <img src="/img/icon-close-black.svg" alt="닫기" />
        <span className="hidden">닫기</span>
      </button>
      <div className="calendars">
        <div className="calendar">
          <div className="month-navigation">
            <button
              type="button"
              className="prev-month"
              onClick={handlePrevClick}
            >
              <img src="/img/icon-arrow.svg" alt="이전" />
              <span className="hidden">이전 달로</span>
            </button>
            <p className="month month-one">
              {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
            </p>
            {isWeb && (
              <p className="month month-two">
                {calendarDate.getMonth() + 2 > 12
                  ? `${calendarDate.getFullYear() + 1}년 ${calendarDate.getMonth() - 10}월`
                  : `${calendarDate.getFullYear()}년 ${calendarDate.getMonth() + 2}월`}
              </p>
            )}
            <button
              type="button"
              className="next-month"
              onClick={handleNextClick}
            >
              <img src="/img/icon-arrow.svg" alt="다음" />
              <span className="hidden">다음 달로</span>
            </button>
          </div>
          <Calendar
            locale="ko-KR"
            calendarType="gregory"
            value={dates}
            onChange={setDates}
            selectRange={tripType === "round"}
            goToRangeStartOnSelect={false}
            activeStartDate={activeStartDate}
            onActiveStartDateChange={handleActiveStartDateChange}
            minDate={new Date()}
            formatDay={(locale, date) =>
              date.toLocaleString("en", { day: "numeric" })
            }
            showNavigation={false}
            showDoubleView={isWeb}
            view="month"
            tileClassName={({ date, view }) => {
              let className = "";
              if (view === "month") {
                if (date.getDay() === 6) {
                  className += " saturday";
                }
                if (date.getDay() === 0) {
                  className += " sunday";
                }
                return className.trim();
              }
            }}
            tileContent={tileContent}
          />
        </div>
      </div>
      <div className="select-button">
        <Button onClick={handleDone}>완료</Button>
      </div>
    </div>
  );
};

export default ScheduleModal;
