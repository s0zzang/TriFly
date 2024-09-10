"use client";

import { recentSearchState } from "@/atoms/atoms";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import "./RecentSearch.scss";
import RecentSearchResult from "./RecentSearchResult";

// 로컬 스토리지 접근 필요
const RecentSearch = () => {
  const [recentSearch, setRecentSearch] = useRecoilState(recentSearchState);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  const result = recentSearch.map((item, index) => (
    <RecentSearchResult key={index} data={item} id={index} />
  ));

  const handleDeleteAll = () => {
    setRecentSearch([]);
  };

  return (
    <>
      {recentSearch.length > 0 && (
        <section className="recent-search full-width">
          <div className="recent-search-wrapper">
            <div className="recent-search-layout">
              <div className="recent-search-menu">
                <h3>최근 검색</h3>
                <button onClick={handleDeleteAll}>전체 삭제</button>
              </div>
              <div className="recent-search-results">{result}</div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default RecentSearch;
