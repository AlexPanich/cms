<ul class="nav navbar-nav navbar-right">
    <li class="dropdown">
        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
            Привет,
            @if(Auth::check())
                {{ Auth::user()->name }}
            @else
                Гость
            @endif
            <span class="caret"></span></a>
        <ul class="dropdown-menu">
            @if(Auth::check())
                <li><a href="/logout">Выйти</a></li>
            @else
                <li><a href="/login">Войти</a></li>
                <li role="separator" class="divider"></li>
                <li><a href="/register">Регистрация</a></li>
            @endif
        </ul>
    </li>
</ul>