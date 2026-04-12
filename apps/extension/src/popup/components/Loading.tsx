export function Loading() {
    return (
        <section className="flowforge-card flowforge-loading" aria-label="Loading" aria-live="polite">
            <div className="flowforge-loading__content">
                <div className="flowforge-cosmic-loader" aria-hidden="true">
                    <div className="flowforge-cosmic-loader__core"></div>
                    <div className="flowforge-cosmic-loader__orbit">
                        <span className="flowforge-cosmic-loader__star flowforge-s1">✦</span>
                        <span className="flowforge-cosmic-loader__star flowforge-s2">✦</span>
                        <span className="flowforge-cosmic-loader__star flowforge-s3">✦</span>
                        <span className="flowforge-cosmic-loader__star flowforge-s4">✦</span>
                    </div>
                    <div className="flowforge-cosmic-loader__sparks">
                        <span className="flowforge-spark flowforge-k1"></span>
                        <span className="flowforge-spark flowforge-k2"></span>
                        <span className="flowforge-spark flowforge-k3"></span>
                        <span className="flowforge-spark flowforge-k4"></span>
                        <span className="flowforge-spark flowforge-k5"></span>
                    </div>
                    <div className="flowforge-cosmic-loader__flash-stars">
                        <span className="flowforge-flash-star flowforge-f1">✦</span>
                        <span className="flowforge-flash-star flowforge-f2">✦</span>
                        <span className="flowforge-flash-star flowforge-f3">✦</span>
                    </div>
                </div>
                <p className="flowforge-loading__text">Forging the page...</p>
            </div>
        </section>
    );
}
