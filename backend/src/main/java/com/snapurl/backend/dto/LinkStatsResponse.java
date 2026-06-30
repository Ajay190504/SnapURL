package com.snapurl.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LinkStatsResponse {
    private String shortCode;
    private String longUrl;
    private long totalClicks;
    private List<DailyClickCount> clicksOverTime;
    private List<ReferrerCount> referrers;
    private List<DeviceCount> devices;

    @Data
    @AllArgsConstructor
    public static class DailyClickCount {
        private String date;
        private long count;
    }

    @Data
    @AllArgsConstructor
    public static class ReferrerCount {
        private String referrer;
        private long count;
    }

    @Data
    @AllArgsConstructor
    public static class DeviceCount {
        private String device;
        private long count;
    }
}
